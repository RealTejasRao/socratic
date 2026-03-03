import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";
import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const WINDOW_SIZE = 30;

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { sessionId, messageId, newContent } = body as {
    sessionId?: string;
    messageId?: string;
    newContent?: string;
  };

  if (!sessionId || typeof sessionId !== "string") {
    return new NextResponse("Invalid sessionId", { status: 400 });
  }

  if (!messageId || typeof messageId !== "string") {
    return new NextResponse("Invalid messageId", { status: 400 });
  }

  if (!newContent || typeof newContent !== "string" || !newContent.trim()) {
    return new NextResponse("Invalid newContent", { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId: dbUser.id,
    },
    select: { id: true },
  });

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const targetMessage = await prisma.message.findFirst({
    where: {
      id: messageId,
      sessionId: session.id,
      role: "USER",
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  if (!targetMessage) {
    return new NextResponse("Message not found", { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  await prisma.$transaction(async (tx) => {
    await tx.message.update({
      where: { id: targetMessage.id },
      data: { content: newContent.trim() },
    });

    await tx.message.deleteMany({
      where: {
        sessionId: session.id,
        OR: [
          { createdAt: { gt: targetMessage.createdAt } },
          {
            createdAt: targetMessage.createdAt,
            id: { not: targetMessage.id },
          },
        ],
      },
    });
  });

  const previousMessagesRaw = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "desc" },
    take: WINDOW_SIZE,
    select: { role: true, content: true },
  });

  const conversationHistory = previousMessagesRaw.reverse().map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  const stream = await openai.chat.completions.stream({
    model: process.env["OPENAI_CHAT_MODEL"]!,
    messages: [
      { role: "system", content: SOCRATIC_SYSTEM_PROMPT },
      ...conversationHistory,
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
        await tx.message.create({
          data: {
            sessionId: session.id,
            role: "ASSISTANT",
            content: assistantText,
          },
        });

        await tx.chatSession.update({
          where: { id: session.id },
          data: {
            lastActivityAt: now,
            expiresAt,
          },
        });
      });
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": session.id,
    },
  });
}
