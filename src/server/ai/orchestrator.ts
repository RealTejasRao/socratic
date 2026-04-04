import {
  deepseek,
  getDeepSeekAuxModel,
  getDeepSeekChatModel,
  getDeepSeekDebateLongModel,
  getDeepSeekDebateShortModel,
  getOpenAIVisionModel,
  openai,
  shouldUseVisionModel,
} from "src/server/ai/providers";
import { prisma } from "src/server/db/client";
import { Prisma } from "@prisma/client";
import {
  buildDebatePrompt,
  buildRoleplayPrompt,
  buildSocraticPrompt,
} from "src/server/ai/prompt-builder";
import type { ChatImageAttachment } from "src/types/chat";
import {
  extractInsightsFromMessage,
  INSIGHT_EXTRACTOR_VERSION,
} from "src/server/ai/insight-extractor";
import {
  buildBeliefPromptContext,
  deleteBeliefsForSourceMessage,
  storeInsightsAsBeliefs,
  storeRawInsightExtraction,
} from "src/server/ai/belief-store";
import { maybeRefreshConversationMemory } from "src/server/ai/memory-store";
import { validateSocraticResponse } from "src/server/ai/response-validator";
import { generateRetrievalQuery } from "src/server/ai/retrieval-query";
import { retrieveHybridPassagesWithDetails } from "src/server/ai/hybrid-retrieval";
import {
  rerankRetrievedPassages,
  type RerankedPassage,
} from "src/server/ai/retrieval-reranker";
import { storeRetrievalTrace } from "src/server/ai/retrieval-trace-store";
import { decideKnowledgeRoute } from "src/server/ai/source-router";
import { performWebSearch } from "src/server/ai/web-search";
import {
  finalizeDebateSession,
  getDebateTimeRemainingSeconds,
} from "src/server/debate/service";
import {
  getRoleplayPhilosopherConfig,
  isRoleplayPhilosopherId,
} from "src/lib/roleplay";

const WINDOW_SIZE = 30; // 15 turns

const PHILOSOPHY_ONLY_REFUSAL =
  "I can only help with philosophy here. Btw, here is an interesting clip for you 😌: https://youtu.be/QDia3e12czc?si=4PzE4MEobSaPcz0Q";

function isPhilosophyRelated(text: string) {
  const normalized = text.toLowerCase().trim();

  if (!normalized) {
    return false;
  }

  const directPhilosophySignals =
    /\b(philosophy|philosophical|ethics|moral|morality|free will|determinism|consciousness|meaning|truth|knowledge|justice|virtue|nihilism|existential|metaphysics|epistemology|logic|aesthetics|political philosophy|stoicism|utilitarianism|deontology|absurdism|identity|duty|purpose|socrates|plato|aristotle|kant|nietzsche|camus|descartes|spinoza|hume)\b/i;

  if (directPhilosophySignals.test(normalized)) {
    return true;
  }

  const abstractQuestionSignals =
    /\b(should|ought|must|can|is|are|why|does)\b/i;
  const conceptualSignals =
    /\b(right|wrong|good|evil|self|mind|freedom|value|reason|existence|beauty|meaning|purpose|responsibility|truth|knowledge|justice)\b/i;

  if (
    abstractQuestionSignals.test(normalized) &&
    conceptualSignals.test(normalized)
  ) {
    return true;
  }

  const shortFollowUpSignals =
    /^(why|how so|go on|continue|elaborate|explain more|what do you mean|can you expand)/i;

  if (normalized.length <= 30 && shortFollowUpSignals.test(normalized)) {
    return true;
  }

  return false;
}

function getDebateGenerationModel(params: {
  durationPreset: "MIN_15" | "MIN_20" | "MIN_30" | "HOUR_1" | "NO_TIMER";
  defaultModel: string;
  auxModel: string;
}) {
  const shortModel = getDeepSeekDebateShortModel() ?? params.auxModel;
  const longModel = getDeepSeekDebateLongModel() ?? params.defaultModel;

  if (
    params.durationPreset === "MIN_15" ||
    params.durationPreset === "MIN_20"
  ) {
    return shortModel;
  }

  return longModel;
}

function getDebateMaxTokens(
  durationPreset: "MIN_15" | "MIN_20" | "MIN_30" | "HOUR_1" | "NO_TIMER",
) {
  switch (durationPreset) {
    case "MIN_15":
      return 140;
    case "MIN_20":
      return 180;
    case "MIN_30":
      return 240;
    case "HOUR_1":
      return 360;
    case "NO_TIMER":
      return 320;
    default:
      return 220;
  }
}

function normalizeImageAttachments(
  value: Prisma.JsonValue | null | undefined,
): ChatImageAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const record = item as Record<string, unknown> | null;

    if (
      record &&
      record["type"] === "image" &&
      typeof record["dataUrl"] === "string" &&
      typeof record["mimeType"] === "string" &&
      typeof record["name"] === "string"
    ) {
      return [
        {
          type: "image" as const,
          dataUrl: record["dataUrl"],
          mimeType: record["mimeType"],
          name: record["name"],
        },
      ];
    }

    return [];
  });
}

export async function generateReply(params: {
  userId: string;
  sessionId: string;
  userContent: string;
  userAttachments?: ChatImageAttachment[];
  forceWebSearch?: boolean;
  now: Date;
  expiresAt: Date;
  persistUserMessage?: boolean;
  appendUserMessageToPrompt?: boolean;
  sourceUserMessageId?: string;
  runInsightExtraction?: boolean;
  replaceBeliefsForSourceMessage?: boolean;
  maxTokens?: number;
}) {
  const pipelineStartedAtMs = Date.now();
  const auxModel = getDeepSeekAuxModel();
  const messageModel = getDeepSeekChatModel();
  let contextMs = 0;
  let retrievalMs: number | null = null;
  let webSearchMs: number | null = null;
  let preStreamTotalMs = 0;
  let streamSetupMs = 0;
  const {
    userId,
    sessionId,
    userContent,
    userAttachments = [],
    forceWebSearch = false,
    now,
    expiresAt,
    persistUserMessage = true,
    appendUserMessageToPrompt = true,
    sourceUserMessageId,
    runInsightExtraction = true,
    replaceBeliefsForSourceMessage = false,
    maxTokens = 500,
  } = params;

  let effectiveSourceMessageId = sourceUserMessageId;

  if (persistUserMessage) {
    const createUserMessageData: Prisma.MessageCreateInput = {
      session: {
        connect: { id: sessionId },
      },
      role: "USER",
      content: userContent,
    };

    if (userAttachments.length > 0) {
      createUserMessageData.attachments =
        userAttachments as unknown as Prisma.InputJsonValue;
    }

    const createdUserMessage = await prisma.message.create({
      data: createUserMessageData,
      select: { id: true },
    });

    effectiveSourceMessageId = createdUserMessage.id;
  }

  const runInsightExtractionTask =
    runInsightExtraction && effectiveSourceMessageId
      ? async () => {
          try {
            const extraction = await extractInsightsFromMessage(userContent);

            const successLogParams: {
              userId: string;
              sessionId: string;
              sourceMessageId: string;
              inputText: string;
              extractorVersion: string;
              extraction: unknown;
              model?: string;
            } = {
              userId,
              sessionId,
              sourceMessageId: effectiveSourceMessageId,
              inputText: userContent,
              extractorVersion: INSIGHT_EXTRACTOR_VERSION,
              extraction: extraction.raw,
            };

            if (extraction.model !== undefined) {
              successLogParams.model = extraction.model;
            }

            await storeRawInsightExtraction(successLogParams);

            if (replaceBeliefsForSourceMessage) {
              await deleteBeliefsForSourceMessage({
                userId,
                sessionId,
                sourceMessageId: effectiveSourceMessageId,
              });
            }

            await storeInsightsAsBeliefs({
              userId,
              sessionId,
              sourceMessageId: effectiveSourceMessageId,
              insights: extraction.insights,
            });
          } catch (error) {
            const errorLogParams: {
              userId: string;
              sessionId: string;
              sourceMessageId: string;
              inputText: string;
              extractorVersion: string;
              error: string;
              model?: string;
            } = {
              userId,
              sessionId,
              sourceMessageId: effectiveSourceMessageId,
              inputText: userContent,
              extractorVersion: INSIGHT_EXTRACTOR_VERSION,
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown insight extraction error",
            };

            if (auxModel !== undefined) {
              errorLogParams.model = auxModel;
            }

            await storeRawInsightExtraction(errorLogParams);
          }
        }
      : null;

  const contextStartedAtMs = Date.now();
  const [session, previousMessagesRaw, rawBeliefs, latestConversationMemory] =
    await prisma.$transaction([
      prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: {
          id: true,
          mode: true,
          debateTone: true,
          debateDurationPreset: true,
          debateHasTimer: true,
          debateTopic: true,
          userDebateSide: true,
          aiDebateSide: true,
          debateStatus: true,
          debateStartedAt: true,
          roleplayMeta: true,
        },
      }),
      prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: WINDOW_SIZE,
        select: { role: true, content: true, attachments: true },
      }),
      prisma.userBelief.findMany({
        where: {
          userId,
          sessionId,
          status: "ACTIVE",
        },
        orderBy: [{ updatedAt: "desc" }, { confidence: "desc" }],
        take: 20,
        select: {
          type: true,
          belief: true,
          confidence: true,
        },
      }),
      prisma.conversationMemorySnapshot.findFirst({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        select: {
          summary: true,
          coveredUntilMessageId: true,
          totalMessages: true,
          version: true,
        },
      }),
    ]);

  if (!session) {
    throw new Error("Session not found for generation.");
  }

  if (session.mode === "DEBATE") {
    if (
      !session.debateTone ||
      !session.debateDurationPreset ||
      !session.debateTopic ||
      !session.userDebateSide ||
      !session.aiDebateSide
    ) {
      throw new Error("Debate session is missing required configuration.");
    }

    if (session.debateStatus === "COMPLETED") {
      throw new Error("Debate session is already completed.");
    }

    const remainingSeconds = getDebateTimeRemainingSeconds({
      startedAt: session.debateStartedAt,
      durationPreset: session.debateDurationPreset,
      now,
    });

    if (remainingSeconds !== null && remainingSeconds <= 0) {
      await finalizeDebateSession({ sessionId });
      throw new Error("Debate session is already completed.");
    }
  }

  if (!isPhilosophyRelated(userContent)) {
    contextMs = Date.now() - contextStartedAtMs;

    const assistantText = PHILOSOPHY_ONLY_REFUSAL;
    const readable = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(assistantText));
        controller.close();
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.message.create({
        data: {
          sessionId,
          role: "ASSISTANT",
          content: assistantText,
          model: "scope-guard-v2",
          tokenIn: null,
          tokenOut: null,
          latencyMs: 0,
          validationVersion: "scope-guard-v2",
          validationScore: 100,
          validationFlags: ["non_philosophy_refusal"] as Prisma.InputJsonValue,
          validationSummary:
            "Rejected non-philosophy request before model generation.",
        },
      });

      await tx.chatSession.update({
        where: { id: sessionId },
        data: {
          lastActivityAt: now,
          expiresAt,
        },
      });
    });

    return {
      readable,
      debug: {
        contextMs,
        retrievalMs: null,
        webSearchMs: null,
        preStreamTotalMs: Date.now() - pipelineStartedAtMs,
        streamSetupMs: 0,
      },
    };
  }

  const beliefContext = buildBeliefPromptContext(rawBeliefs, 5);
  contextMs = Date.now() - contextStartedAtMs;
  const roleplayMetaRecord =
    session.roleplayMeta &&
    typeof session.roleplayMeta === "object" &&
    !Array.isArray(session.roleplayMeta)
      ? (session.roleplayMeta as Record<string, unknown>)
      : null;
  const roleplayPhilosopherId = isRoleplayPhilosopherId(
    roleplayMetaRecord?.["philosopherId"],
  )
    ? roleplayMetaRecord["philosopherId"]
    : null;
  const roleplayPhilosopher =
    session.mode === "ROLEPLAY" && roleplayPhilosopherId
      ? getRoleplayPhilosopherConfig(roleplayPhilosopherId)
      : null;

  const conversationHistory = previousMessagesRaw.reverse().map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
    ...(msg.role === "USER"
      ? { attachments: normalizeImageAttachments(msg.attachments) }
      : {}),
  }));
  const baseKnowledgeRoute = decideKnowledgeRoute({
    userContent,
    userAttachments,
    forceWebSearch,
  });
  const knowledgeRoute =
    session.mode === "DEBATE" && baseKnowledgeRoute === "web"
      ? "conversation_only"
      : session.mode === "ROLEPLAY"
        ? forceWebSearch
          ? "hybrid"
          : "rag"
        : baseKnowledgeRoute;

  const originalQuery = userContent;
  let rewrittenQuery = userContent;
  let retrievalQuery = userContent;
  let retrievedPassages: Array<{
    title: string;
    author: string;
    chunkType: string;
    content: string;
    chunkIndex: number;
  }> = [];
  let rerankedCandidates: RerankedPassage[] = [];
  let tracePayload: {
    vectorCandidates: Awaited<
      ReturnType<typeof retrieveHybridPassagesWithDetails>
    >["vectorCandidates"];
    lexicalCandidates: Awaited<
      ReturnType<typeof retrieveHybridPassagesWithDetails>
    >["lexicalCandidates"];
    fusedCandidates: Awaited<
      ReturnType<typeof retrieveHybridPassagesWithDetails>
    >["fusedCandidates"];
    rerankedCandidates: RerankedPassage[];
    selectedPassages: RerankedPassage[];
    retrievalLatencyMs: number;
  } | null = null;
  let webSearchSummary: string | undefined;
  let webSearchSources:
    | Array<{
        title: string;
        url: string;
      }>
    | undefined;
  const shouldUseRetrieval =
    knowledgeRoute === "rag" || knowledgeRoute === "hybrid";
  const shouldUseWebSearch =
    session.mode === "DEBATE"
      ? forceWebSearch &&
        (knowledgeRoute === "web" || knowledgeRoute === "hybrid")
      : knowledgeRoute === "web" || knowledgeRoute === "hybrid";

  if (!shouldUseRetrieval) {
    retrievalQuery = `retrieval-skipped-for-${knowledgeRoute}`;
  } else {
    try {
      const retrievalStartedAtMs = Date.now();
      rewrittenQuery = await generateRetrievalQuery(originalQuery);
      retrievalQuery = rewrittenQuery || originalQuery;

      if (session.mode === "ROLEPLAY" && roleplayPhilosopher) {
        retrievalQuery = `${retrievalQuery} ${roleplayPhilosopher.retrievalHint}`;
      }

      const retrievalDetails = await retrieveHybridPassagesWithDetails({
        query: retrievalQuery,
        limit: 12,
      });
      rerankedCandidates = rerankRetrievedPassages({
        query: retrievalQuery,
        userMessage: userContent,
        candidates: retrievalDetails.fusedCandidates,
        minPassages: 4,
        maxPassages: 5,
      });

      retrievedPassages = rerankedCandidates.map((item) => ({
        title: item.title,
        author: item.author,
        chunkType: item.chunkType,
        content: item.content,
        chunkIndex: item.chunkIndex,
      }));
      tracePayload = {
        vectorCandidates: retrievalDetails.vectorCandidates,
        lexicalCandidates: retrievalDetails.lexicalCandidates,
        fusedCandidates: retrievalDetails.fusedCandidates,
        rerankedCandidates,
        selectedPassages: rerankedCandidates,
        retrievalLatencyMs: Date.now() - retrievalStartedAtMs,
      };
      retrievalMs = tracePayload.retrievalLatencyMs;
    } catch {
      // Retrieval is best-effort; generation should continue even if retrieval fails.
    }
  }

  if (shouldUseWebSearch) {
    try {
      const webSearchStartedAtMs = Date.now();
      const webSearchResult = await performWebSearch(userContent);
      webSearchMs = Date.now() - webSearchStartedAtMs;

      if (webSearchResult) {
        webSearchSummary = webSearchResult.summary;
        webSearchSources = webSearchResult.sources;
      }
    } catch {
      // Web search is best-effort; generation should continue even if it fails.
    }
  }

  const shouldAppendLatestUserMessage =
    appendUserMessageToPrompt &&
    !persistUserMessage &&
    !effectiveSourceMessageId;
  const useVisionModel = shouldUseVisionModel(userAttachments);

  const sharedPromptBuilderParams = {
    conversationHistory,
    beliefContext,
    retrievedContext: retrievedPassages,
    userContent,
    appendUserMessageToPrompt: shouldAppendLatestUserMessage,
    knowledgeRoute,
    ...(webSearchSummary !== undefined ? { webSearchSummary } : {}),
    ...(webSearchSources !== undefined ? { webSearchSources } : {}),
    ...(userAttachments !== undefined ? { userAttachments } : {}),
    includeVisionContent: useVisionModel,
    ...(latestConversationMemory?.summary !== undefined
      ? { conversationMemorySummary: latestConversationMemory.summary }
      : {}),
  };

  const builtPrompt =
    session.mode === "DEBATE" &&
    session.debateTone &&
    session.debateDurationPreset &&
    session.debateTopic &&
    session.userDebateSide &&
    session.aiDebateSide
      ? buildDebatePrompt({
          ...sharedPromptBuilderParams,
          debate: {
            topic: session.debateTopic,
            tone: session.debateTone,
            durationPreset: session.debateDurationPreset,
            userSide: session.userDebateSide,
            aiSide: session.aiDebateSide,
            hasTimer: session.debateHasTimer,
          },
        })
      : session.mode === "ROLEPLAY" && roleplayPhilosopher
        ? buildRoleplayPrompt({
            ...sharedPromptBuilderParams,
            knowledgeRoute:
              knowledgeRoute === "conversation_only" ? "rag" : knowledgeRoute,
            roleplay: {
              philosopherName: roleplayPhilosopher.name,
              tradition: roleplayPhilosopher.tradition,
              schoolLabel: roleplayPhilosopher.schoolLabel,
              voiceGuide: roleplayPhilosopher.voiceGuide,
              openingPrompt: roleplayPhilosopher.openingPrompt,
              retrievalAuthors: [...roleplayPhilosopher.retrievalAuthors],
            },
          })
        : buildSocraticPrompt(sharedPromptBuilderParams);
  preStreamTotalMs = Date.now() - pipelineStartedAtMs;

  const generationStartedAtMs = Date.now();

  const shouldLogPromptPayload =
    process.env["AI_DEBUG_PROMPT"] === "true" ||
    process.env["AI_DEBUG_PROMPT_MESSAGES"] === "true";

  if (shouldLogPromptPayload) {
    console.log(
      "PROMPT_CONTEXT",
      JSON.stringify(
        {
          conversationMemorySummary: latestConversationMemory?.summary ?? null,
          beliefContext,
          knowledgeRoute,
          originalQuery,
          rewrittenQuery,
          retrievalQuery,
          retrievedPassages,
          webSearchSummary,
          webSearchSources,
        },
        null,
        2,
      ),
    );
    console.log(
      "RAW_PROMPT_MESSAGES",
      JSON.stringify(builtPrompt.messages, null, 2),
    );
  }
  if (process.env["AI_DEBUG_PROMPT"] === "true") {
    const finalDocumentDistribution = rerankedCandidates.reduce<
      Record<string, { documentId: string; count: number }>
    >((accumulator, candidate) => {
      const existing = accumulator[candidate.title];
      if (existing) {
        existing.count += 1;
        return accumulator;
      }

      accumulator[candidate.title] = {
        documentId: candidate.documentId,
        count: 1,
      };
      return accumulator;
    }, {});
    console.log("RETRIEVAL_QUERY_FLOW", {
      originalQuery,
      rewrittenQuery,
      retrievalQuery,
    });
    console.log(
      "TOP_RETRIEVED_CHUNKS",
      tracePayload
        ? tracePayload.fusedCandidates.slice(0, 10).map((candidate) => ({
            author: candidate.author,
            title: candidate.title,
            chunkType: candidate.chunkType,
            chunkIndex: candidate.chunkIndex,
            fusedScore: Number(candidate.fusedScore.toFixed(3)),
            lexicalScore: Number(candidate.lexicalScore.toFixed(3)),
            semanticScore: Number(candidate.semanticScore.toFixed(3)),
          }))
        : [],
    );
    console.log(
      "RETRIEVAL_CANDIDATE_SCORES",
      tracePayload
        ? tracePayload.fusedCandidates.map((candidate) => ({
            author: candidate.author,
            title: candidate.title,
            chunkType: candidate.chunkType,
            chunkIndex: candidate.chunkIndex,
            fusedScore: Number(candidate.fusedScore.toFixed(3)),
            lexicalScore: Number(candidate.lexicalScore.toFixed(3)),
            semanticScore: Number(candidate.semanticScore.toFixed(3)),
            embeddingSimilarity: Number(
              candidate.embeddingSimilarity.toFixed(3),
            ),
            semanticRelevance: Number(candidate.semanticRelevance.toFixed(3)),
            queryTypeFit: Number(candidate.queryTypeFit.toFixed(3)),
            chunkTypeBoost: Number(candidate.chunkTypeBoost.toFixed(3)),
          }))
        : [],
    );
    console.log(
      "RERANKED_SELECTION",
      rerankedCandidates.map((candidate) => ({
        author: candidate.author,
        title: candidate.title,
        chunkType: candidate.chunkType,
        chunkIndex: candidate.chunkIndex,
        rerankScore: Number(candidate.rerankScore.toFixed(3)),
        fusedScore: Number(candidate.fusedScore.toFixed(3)),
        lexicalScore: Number(candidate.lexicalScore.toFixed(3)),
        semanticScore: Number(candidate.semanticScore.toFixed(3)),
        embeddingSimilarity: Number(candidate.embeddingSimilarity.toFixed(3)),
        semanticRelevance: Number(candidate.semanticRelevance.toFixed(3)),
        queryTypeFit: Number(candidate.queryTypeFit.toFixed(3)),
        chunkTypeBoost: Number(candidate.chunkTypeBoost.toFixed(3)),
      })),
    );
    console.log("RETRIEVAL_QUERY", retrievalQuery);
    console.log("RETRIEVAL_COUNTS", {
      reranked: rerankedCandidates.length,
      selected: retrievedPassages.length,
    });
    console.log("FINAL_DOCUMENT_DISTRIBUTION", finalDocumentDistribution);
    console.log("PIPELINE_TIMING", {
      contextMs,
      retrievalMs: tracePayload?.retrievalLatencyMs ?? null,
      webSearchMs,
      preStreamTotalMs,
    });
  }
  const streamSetupStartedAtMs = Date.now();
  const effectiveModel = useVisionModel
    ? getOpenAIVisionModel()
    : session.mode === "DEBATE" && session.debateDurationPreset
      ? getDebateGenerationModel({
          durationPreset: session.debateDurationPreset,
          defaultModel: messageModel,
          auxModel,
        })
      : messageModel;
  const effectiveMaxTokens =
    session.mode === "DEBATE" && session.debateDurationPreset
      ? Math.min(maxTokens, getDebateMaxTokens(session.debateDurationPreset))
      : maxTokens;
  const generationClient = useVisionModel ? openai : deepseek;
  const stream = await generationClient.chat.completions.stream({
    model: effectiveModel,
    messages: builtPrompt.messages,
    temperature: 1,
    max_tokens: effectiveMaxTokens,
  });
  streamSetupMs = Date.now() - streamSetupStartedAtMs;

  let assistantText = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          assistantText += token;
          controller.enqueue(new TextEncoder().encode(token));
        }
      }

      controller.close();

      let completionModel: string | undefined = effectiveModel;
      let promptTokens: number | undefined =
        builtPrompt.metadata.estimatedInputTokens;
      let completionTokens: number | undefined;

      try {
        const finalCompletion = await stream.finalChatCompletion();
        completionModel = finalCompletion.model ?? completionModel;
        promptTokens = finalCompletion.usage?.prompt_tokens ?? promptTokens;
        completionTokens = finalCompletion.usage?.completion_tokens;
      } catch {
        // Streaming can finish without usage payload. keep best effort metadata.
      }

      const latencyMs = Date.now() - generationStartedAtMs;
      const validation =
        session.mode === "DEBATE"
          ? {
              version: "debate-validator-v1",
              score: 100,
              flags: [],
              summary: "Debate response validation not yet specialized.",
            }
          : validateSocraticResponse({
              userContent,
              assistantContent: assistantText,
              beliefStatements: beliefContext.map((item) => item.belief),
              conversationMemorySummary: latestConversationMemory?.summary,
              retrievedSources: retrievedPassages.map(
                (item) =>
                  `${item.author} - ${item.title} | chunk ${item.chunkIndex}`,
              ),
              retrievedPassageTexts: retrievedPassages.map(
                (item) => item.content,
              ),
            });

      await prisma.$transaction(async (tx) => {
        await tx.message.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content: assistantText,
            model: completionModel
              ? `${completionModel} (${builtPrompt.metadata.promptVersion})`
              : builtPrompt.metadata.promptVersion,
            tokenIn: promptTokens ?? null,
            tokenOut: completionTokens ?? null,
            latencyMs,
            validationVersion: validation.version,
            validationScore: validation.score,
            validationFlags: validation.flags as Prisma.InputJsonValue,
            validationSummary: validation.summary,
          },
        });

        await tx.chatSession.update({
          where: { id: sessionId },
          data: {
            lastActivityAt: now,
            expiresAt,
          },
        });
      });

      if (tracePayload) {
        try {
          const traceParams: Parameters<typeof storeRetrievalTrace>[0] = {
            userId,
            sessionId,
            rawUserQuery: userContent,
            retrievalQuery,
            vectorCandidates: tracePayload.vectorCandidates,
            lexicalCandidates: tracePayload.lexicalCandidates,
            fusedCandidates: tracePayload.fusedCandidates,
            rerankedCandidates: tracePayload.rerankedCandidates,
            selectedPassages: tracePayload.selectedPassages,
            retrievalLatencyMs: tracePayload.retrievalLatencyMs,
          };

          if (effectiveSourceMessageId !== undefined) {
            traceParams.sourceMessageId = effectiveSourceMessageId;
          }

          await storeRetrievalTrace(traceParams);
        } catch {
          // Retrieval trace logging should never block response delivery.
        }
      }

      try {
        await maybeRefreshConversationMemory({ sessionId });
      } catch {
        // Memory refresh should never block response delivery.
      }

      if (runInsightExtractionTask) {
        runInsightExtractionTask().catch(() => {
          // Insight extraction must never affect response lifecycle.
        });
      }
    },
  });

  return {
    readable,
    debug: {
      contextMs,
      retrievalMs,
      webSearchMs,
      preStreamTotalMs,
      streamSetupMs,
    },
  };
}
