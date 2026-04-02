import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";
import { generateSessionTitle } from "src/server/chat/generate-session-title";
import { finalizeDebateSession, getDebateTimeRemainingSeconds } from "src/server/debate/service";
import type { ChatImageAttachment } from "src/types/chat";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_ATTACHMENTS = 3;

function isValidAttachment(value: unknown): value is ChatImageAttachment {
  return Boolean(
    value &&
      typeof value === "object" &&
      "type" in value &&
      "dataUrl" in value &&
      "mimeType" in value &&
      "name" in value &&
      value.type === "image" &&
      typeof value.dataUrl === "string" &&
      typeof value.mimeType === "string" &&
      typeof value.name === "string",
  );
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
    attachments?: unknown;
    webSearch?: unknown;
  };
  const attachments = Array.isArray(body?.attachments)
    ? body.attachments.filter(isValidAttachment).slice(0, MAX_ATTACHMENTS)
    : [];
  const forceWebSearch = body?.webSearch === true;

  if (typeof content !== "string") {
    return new NextResponse("Invalid content", { status: 400 });
  }
  if (!content.trim() && attachments.length === 0) {
    return new NextResponse("Message must include text or image", { status: 400 });
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

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

    const derivedTitle =
      (await generateSessionTitle(content)) ??
      (attachments.length > 0 ? "Image upload" : null);

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
        mode: true,
        debateStatus: true,
        debateStartedAt: true,
        debateDurationPreset: true,
      },
    });

    if (!existingSession) {
      return new NextResponse("Session not found", { status: 404 });
    }

    if (existingSession.mode === "DEBATE") {
      if (existingSession.debateStatus === "COMPLETED") {
        return new NextResponse("This debate has already ended.", {
          status: 409,
        });
      }

      const remainingSeconds = getDebateTimeRemainingSeconds({
        startedAt: existingSession.debateStartedAt,
        durationPreset: existingSession.debateDurationPreset,
      });

      if (remainingSeconds !== null && remainingSeconds <= 0) {
        await finalizeDebateSession({ sessionId: existingSession.id });
        return new NextResponse("This debate has already ended.", {
          status: 409,
        });
      }
    }

    if (!existingSession.title) {
      const derivedTitle =
        (await generateSessionTitle(content)) ??
        (attachments.length > 0 ? "Image upload" : null);

      if (derivedTitle) {
        await prisma.chatSession.update({
          where: { id: existingSession.id },
          data: { title: derivedTitle },
        });
      }
    }

    activeUserId = existingSession.userId;
  }

  const generationResult = await generateAssistantReply({
    userId: activeUserId,
    sessionId: activeSessionId!,
    userContent: content,
    userAttachments: attachments,
    forceWebSearch,
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
      "X-AI-Web-Search-Ms": String(generationResult.debug.webSearchMs ?? 0),
      "X-AI-Prestream-Ms": String(generationResult.debug.preStreamTotalMs),
      "X-AI-Stream-Setup-Ms": String(generationResult.debug.streamSetupMs),
    },
  });
}
