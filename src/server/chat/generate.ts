import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";
import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";

const WINDOW_SIZE = 30; // 15 turns

export async function generateAssistantReply(params: {
  sessionId: string;
  userContent: string;
  now: Date;
  expiresAt: Date;
  persistUserMessage?: boolean;
}) {
  const { sessionId, userContent, now, expiresAt, persistUserMessage=true } = params;

  const previousMessagesRaw = await prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: WINDOW_SIZE,
    select: { role: true, content: true },
  });

  const previousMessages = previousMessagesRaw.reverse();

  const conversationHistory = previousMessages.map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  const stream = await openai.chat.completions.stream({
    model: process.env["OPENAI_CHAT_MODEL"]!,
    messages: [
      { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 300,
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
