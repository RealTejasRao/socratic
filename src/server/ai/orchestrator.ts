import { openai } from "src/server/ai/openai";
import { prisma } from "src/server/db/client";
import { Prisma } from "@prisma/client";
import { buildSocraticPrompt } from "src/server/ai/prompt-builder";
import { extractInsightsFromMessage, INSIGHT_EXTRACTOR_VERSION } from "src/server/ai/insight-extractor";
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

const WINDOW_SIZE = 30; // 15 turns

export async function generateReply(params: {
  userId: string;
  sessionId: string;
  userContent: string;
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
  const auxModel =
    process.env["OPENAI_AUX_MODEL"] ??
    process.env["OPENAI_CHAT_MODEL"];
  const messageModel =
    process.env["OPENAI_MESSAGE_MODEL"] ??
    auxModel!;
  let contextMs = 0;
  let retrievalMs: number | null = null;
  let preStreamTotalMs = 0;
  let streamSetupMs = 0;
  const {
    userId,
    sessionId,
    userContent,
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
    const createdUserMessage = await prisma.message.create({
      data: {
        sessionId,
        role: "USER",
        content: userContent,
      },
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
              error: error instanceof Error ? error.message : "Unknown insight extraction error",
            };

            if (auxModel !== undefined) {
              errorLogParams.model = auxModel;
            }

            await storeRawInsightExtraction(errorLogParams);
          }
        }
      : null;

  const contextStartedAtMs = Date.now();
  const [previousMessagesRaw, rawBeliefs, latestConversationMemory] =
    await prisma.$transaction([
      prisma.message.findMany({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
        take: WINDOW_SIZE,
        select: { role: true, content: true },
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
  const beliefContext = buildBeliefPromptContext(rawBeliefs, 5);
  contextMs = Date.now() - contextStartedAtMs;

  const conversationHistory = previousMessagesRaw.reverse().map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

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

  try {
    const retrievalStartedAtMs = Date.now();
    const queryExpansionEnabled =
      process.env["RAG_QUERY_EXPANSION_ENABLED"] === "true";
    retrievalQuery = queryExpansionEnabled
      ? await generateRetrievalQuery(userContent)
      : userContent;
    let retrievalDetails = await retrieveHybridPassagesWithDetails({
      query: retrievalQuery,
      semanticQuery: userContent,
      limit: 12,
    });

    // If expanded query returns nothing, retry once with raw user text.
    if (
      retrievalDetails.fusedCandidates.length === 0 &&
      retrievalQuery.trim().toLowerCase() !== userContent.trim().toLowerCase()
    ) {
      retrievalQuery = userContent;
      retrievalDetails = await retrieveHybridPassagesWithDetails({
        query: retrievalQuery,
        semanticQuery: userContent,
        limit: 12,
      });
    }
    rerankedCandidates = rerankRetrievedPassages({
      query: retrievalQuery,
      userMessage: userContent,
      candidates: retrievalDetails.fusedCandidates,
      minPassages: 2,
      maxPassages: 3,
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

  const shouldAppendLatestUserMessage =
    appendUserMessageToPrompt && !persistUserMessage && !effectiveSourceMessageId;

  const promptBuilderParams: {
    conversationHistory: { role: "user" | "assistant"; content: string }[];
    beliefContext: { type: "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION"; belief: string; confidence: number }[];
    retrievedContext: { title: string; author: string; chunkType: string; content: string; chunkIndex: number }[];
    userContent: string;
    appendUserMessageToPrompt: boolean;
    conversationMemorySummary?: string;
  } = {
    conversationHistory,
    beliefContext,
    retrievedContext: retrievedPassages,
    userContent,
    appendUserMessageToPrompt: shouldAppendLatestUserMessage,
  };

  if (latestConversationMemory?.summary !== undefined) {
    promptBuilderParams.conversationMemorySummary = latestConversationMemory.summary;
  }

  const builtPrompt = buildSocraticPrompt(promptBuilderParams);
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
        retrievalQuery,
        retrievedPassages,
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
          embeddingSimilarity: Number(candidate.embeddingSimilarity.toFixed(3)),
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
  console.log("PIPELINE_TIMING", {
    contextMs,
    retrievalMs: tracePayload?.retrievalLatencyMs ?? null,
    preStreamTotalMs,
  });
}
  const streamSetupStartedAtMs = Date.now();
  const stream = await openai.chat.completions.stream({
    model: messageModel,
    messages: builtPrompt.messages,
    temperature: 1,
    max_tokens: maxTokens,
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

      let completionModel: string | undefined = messageModel;
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
      const validation = validateSocraticResponse({
        userContent,
        assistantContent: assistantText,
        beliefStatements: beliefContext.map((item) => item.belief),
        conversationMemorySummary: latestConversationMemory?.summary,
        retrievedSources: retrievedPassages.map(
          (item) => `${item.author} - ${item.title} | chunk ${item.chunkIndex}`,
        ),
        retrievedPassageTexts: retrievedPassages.map((item) => item.content),
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
      preStreamTotalMs,
      streamSetupMs,
    },
  };
}
