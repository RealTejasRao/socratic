import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

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

  const readable = await generateAssistantReply({
    sessionId: session.id,
    userContent: newContent.trim(),
    now,
    expiresAt,
    persistUserMessage: false,
    appendUserMessageToPrompt: false,
    maxTokens: 300,
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": session.id,
    },
  });
}
