import { openai } from "src/server/ai/openai";
import { prisma } from "src/server/db/client";

export const CONVERSATION_MEMORY_VERSION = "memory-v1.0";
const SHORT_TERM_WINDOW = 30;
const MIN_NEW_MESSAGES_FOR_REFRESH = 10;

function formatMessagesForSummary(
  messages: Array<{ role: "USER" | "ASSISTANT"; content: string }>,
) {
  return messages
    .map((message) => {
      const prefix = message.role === "USER" ? "User" : "Assistant";
      return `${prefix}: ${message.content}`;
    })
    .join("\n");
}

async function summarizeConversationChunk(params: {
  previousSummary: string | undefined;
  transcript: string;
}) {
  const messages: Array<{ role: "system" | "user"; content: string }> = [
    {
      role: "system",
      content: [
        "You write compact conversation memory for a Socratic dialogue system.",
        "Return plain text only.",
        "Focus on: core claims, contradictions, shifts in position, unresolved questions, and commitments.",
        "Do not include filler.",
      ].join(" "),
    },
  ];

  if (params.previousSummary) {
    messages.push({
      role: "user",
      content: `Existing summary:\n${params.previousSummary}`,
    });
  }

  messages.push({
    role: "user",
    content: `New conversation chunk to integrate:\n${params.transcript}`,
  });

  const completion = await openai.chat.completions.create({
    model: process.env["OPENAI_CHAT_MODEL"]!,
    temperature: 0.2,
    max_tokens: 450,
    messages,
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}

export async function getLatestConversationMemory(sessionId: string) {
  return prisma.conversationMemorySnapshot.findFirst({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    select: {
      summary: true,
      coveredUntilMessageId: true,
      totalMessages: true,
      version: true,
    },
  });
}

export async function invalidateConversationMemory(sessionId: string) {
  await prisma.conversationMemorySnapshot.deleteMany({
    where: { sessionId },
  });
}

export async function maybeRefreshConversationMemory(params: {
  sessionId: string;
}) {
  const latestSnapshot = await getLatestConversationMemory(params.sessionId);

  const allMessages = await prisma.message.findMany({
    where: { sessionId: params.sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
    },
  });

  if (allMessages.length <= SHORT_TERM_WINDOW) {
    return;
  }

  const coveredIndex = latestSnapshot?.coveredUntilMessageId
    ? allMessages.findIndex(
        (message) => message.id === latestSnapshot.coveredUntilMessageId,
      )
    : -1;

  const cutoffIndex = allMessages.length - SHORT_TERM_WINDOW - 1;
  if (cutoffIndex < 0) {
    return;
  }

  if (
    latestSnapshot?.coveredUntilMessageId &&
    allMessages[cutoffIndex]?.id === latestSnapshot.coveredUntilMessageId
  ) {
    return;
  }

  const startIndex = coveredIndex >= 0 ? coveredIndex + 1 : 0;
  const chunk = allMessages.slice(startIndex, cutoffIndex + 1);

  if (chunk.length < MIN_NEW_MESSAGES_FOR_REFRESH) {
    return;
  }

  const transcript = formatMessagesForSummary(chunk);
  const summarizeParams: {
    previousSummary: string | undefined;
    transcript: string;
  } = {
    previousSummary: latestSnapshot?.summary,
    transcript,
  };
  const summary = await summarizeConversationChunk(summarizeParams);

  if (!summary) {
    return;
  }

  const coveredUntilMessage = allMessages[cutoffIndex];
  if (!coveredUntilMessage) {
    return;
  }

  await prisma.conversationMemorySnapshot.create({
    data: {
      sessionId: params.sessionId,
      summary,
      coveredUntilMessageId: coveredUntilMessage.id,
      totalMessages: allMessages.length,
      version: CONVERSATION_MEMORY_VERSION,
    },
  });
}
