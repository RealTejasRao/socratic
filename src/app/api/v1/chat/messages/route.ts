import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_TITLE_MAX_LENGTH = 80;

function deriveSessionTitleFromContent(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, SESSION_TITLE_MAX_LENGTH);
}

export async function POST(req: Request) {
  const requestStartedAtMs = Date.now();
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();

  const { sessionId, content } = body as {
    sessionId?: string;
    content?: string;
  };

  if (!content || typeof content !== "string") {
    return new NextResponse("Invalid content", { status: 400 });
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
  const derivedTitle = deriveSessionTitleFromContent(content);

  let activeSessionId = sessionId;
  let activeUserId: string;

  if (!activeSessionId) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!dbUser) {
      return new NextResponse("User not found in DB", { status: 404 });
    }

    const newSession = await prisma.chatSession.create({
      data: {
        userId: dbUser.id,
        title: derivedTitle,
        expiresAt,
        lastActivityAt: now,
      },
    });

    activeSessionId = newSession.id;
    activeUserId = dbUser.id;
  } else {
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: activeSessionId,
        user: {
          clerkUserId,
        },
      },
      select: {
        id: true,
        title: true,
        userId: true,
      },
    });

    if (!existingSession) {
      return new NextResponse("Session not found", { status: 404 });
    }

    if (!existingSession.title && derivedTitle) {
      await prisma.chatSession.update({
        where: { id: existingSession.id },
        data: { title: derivedTitle },
      });
    }

    activeUserId = existingSession.userId;
  }

  const generationResult = await generateAssistantReply({
    userId: activeUserId,
    sessionId: activeSessionId!,
    userContent: content,
    now,
    expiresAt,
  });
  const prepareMs = Date.now() - requestStartedAtMs;

  return new Response(generationResult.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": activeSessionId!,
      "X-Server-Prepare-Ms": String(prepareMs),
      "X-AI-Context-Ms": String(generationResult.debug.contextMs),
      "X-AI-Retrieval-Ms": String(generationResult.debug.retrievalMs ?? 0),
      "X-AI-Prestream-Ms": String(generationResult.debug.preStreamTotalMs),
      "X-AI-Stream-Setup-Ms": String(generationResult.debug.streamSetupMs),
    },
  });
}
