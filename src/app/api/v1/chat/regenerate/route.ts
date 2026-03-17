import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const { sessionId } = await req.json();

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      user: {
        clerkUserId: userId,
      },
    },
    select: { id: true, userId: true },
  });

  if (!session) return new NextResponse("Session not found", { status: 404 });

  // last user message
  const lastUserMessage = await prisma.message.findFirst({
    where: {
      sessionId: session.id,
      role: "USER",
    },
    orderBy: { createdAt: "desc" },
  });

  if (!lastUserMessage) {
    return new NextResponse("No user message found", { status: 400 });
  }

  // Delete last assistant message
  await prisma.message.deleteMany({
    where: {
      sessionId: session.id,
      role: "ASSISTANT",
      createdAt: {
        gt: lastUserMessage.createdAt,
      },
    },
  });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  const generationResult = await generateAssistantReply({
    userId: session.userId,
    sessionId: session.id,
    userContent: lastUserMessage.content,
    now,
    expiresAt,
    persistUserMessage: false,
    sourceUserMessageId: lastUserMessage.id,
    appendUserMessageToPrompt: false,
    runInsightExtraction: false,
  });

  return new Response(generationResult.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": session.id,
      "X-AI-Context-Ms": String(generationResult.debug.contextMs),
      "X-AI-Retrieval-Ms": String(generationResult.debug.retrievalMs ?? 0),
      "X-AI-Prestream-Ms": String(generationResult.debug.preStreamTotalMs),
      "X-AI-Stream-Setup-Ms": String(generationResult.debug.streamSetupMs),
    },
  });
}
