import { openai } from "src/server/ai/openai";
import { prisma } from "src/server/db/client";
import { buildSocraticPrompt } from "src/server/ai/prompt-builder";

const WINDOW_SIZE = 30; // 15 turns

export async function generateReply(params: {
  sessionId: string;
  userContent: string;
  now: Date;
  expiresAt: Date;
  persistUserMessage?: boolean;
  appendUserMessageToPrompt?: boolean;
  maxTokens?: number;
}) {
  const {
    sessionId,
    userContent,
    now,
    expiresAt,
    persistUserMessage = true,
    appendUserMessageToPrompt = true,
    maxTokens = 500,
  } = params;

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

  const promptMessages = buildSocraticPrompt({
    conversationHistory,
    userContent,
    appendUserMessageToPrompt,
  });

  const stream = await openai.chat.completions.stream({
    model: process.env["OPENAI_CHAT_MODEL"]!,
    messages: promptMessages,
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

      await prisma.$transaction(async (tx) => {
        if (persistUserMessage) {
          await tx.message.create({
            data: {
              sessionId,
              role: "USER",
              content: userContent,
            },
          });
        }

        await tx.message.create({
          data: {
            sessionId,
            role: "ASSISTANT",
            content: assistantText,
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
    },
  });

  return readable;
}
