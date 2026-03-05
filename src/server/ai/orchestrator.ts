import { openai } from "src/server/ai/openai";
import { prisma } from "src/server/db/client";
import { buildSocraticPrompt } from "src/server/ai/prompt-builder";
import { extractInsightsFromMessage, INSIGHT_EXTRACTOR_VERSION } from "src/server/ai/insight-extractor";
import {
  deleteBeliefsForSourceMessage,
  getBeliefsForPrompt,
  storeInsightsAsBeliefs,
  storeRawInsightExtraction,
} from "src/server/ai/belief-store";
import {
  getLatestConversationMemory,
  maybeRefreshConversationMemory,
} from "src/server/ai/memory-store";

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

  if (runInsightExtraction && effectiveSourceMessageId) {
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

      if (process.env["OPENAI_CHAT_MODEL"] !== undefined) {
        errorLogParams.model = process.env["OPENAI_CHAT_MODEL"];
      }

      await storeRawInsightExtraction(errorLogParams);
    }
  }

  const previousMessagesRaw = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: WINDOW_SIZE,
    select: { role: true, content: true },
  });

  const conversationHistory = previousMessagesRaw.reverse().map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  const beliefContext = await getBeliefsForPrompt({
    userId,
    sessionId,
    take: 5,
  });
  const latestConversationMemory = await getLatestConversationMemory(sessionId);
  const shouldAppendLatestUserMessage =
    appendUserMessageToPrompt && !persistUserMessage && !effectiveSourceMessageId;

  const promptBuilderParams: {
    conversationHistory: { role: "user" | "assistant"; content: string }[];
    beliefContext: { type: "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION"; belief: string; confidence: number }[];
    userContent: string;
    appendUserMessageToPrompt: boolean;
    conversationMemorySummary?: string;
  } = {
    conversationHistory,
    beliefContext,
    userContent,
    appendUserMessageToPrompt: shouldAppendLatestUserMessage,
  };

  if (latestConversationMemory?.summary !== undefined) {
    promptBuilderParams.conversationMemorySummary = latestConversationMemory.summary;
  }

  const builtPrompt = buildSocraticPrompt(promptBuilderParams);

  const generationStartedAtMs = Date.now();
  const stream = await openai.chat.completions.stream({
    model: process.env["OPENAI_CHAT_MODEL"]!,
    messages: builtPrompt.messages,
    temperature: 0.7,
    max_tokens: maxTokens,
  });

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

      let completionModel: string | undefined = process.env["OPENAI_CHAT_MODEL"];
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

      try {
        await maybeRefreshConversationMemory({ sessionId });
      } catch {
        // Memory refresh should never block response delivery.
      }
    },
  });

  return readable;
}
