import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";
import {
  finalizeDebateSession,
  getDebateTimeRemainingSeconds,
} from "src/server/debate/service";
import {
  consumeUserRateLimit,
  createRateLimitHeaders,
  getRequestIp,
} from "src/server/security/rate-limit";
import type { ChatImageAttachment } from "src/types/chat";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

function normalizeImageAttachments(value: unknown): ChatImageAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item: unknown) => {
    if (
      item &&
      typeof item === "object" &&
      "type" in item &&
      "dataUrl" in item &&
      "mimeType" in item &&
      "name" in item &&
      item.type === "image" &&
      typeof item.dataUrl === "string" &&
      typeof item.mimeType === "string" &&
      typeof item.name === "string"
    ) {
      return [
        {
          type: "image" as const,
          dataUrl: item.dataUrl,
          mimeType: item.mimeType,
          name: item.name,
        },
      ];
    }

    return [];
  });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const rateLimit = await consumeUserRateLimit({
    scope: "chat:regenerate",
    userId,
    ip: getRequestIp(req),
    limit: 90,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return new NextResponse(
      "Too many requests. Please wait a moment and try again.",
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  const { sessionId } = await req.json();

  if (typeof sessionId !== "string" || !sessionId.trim()) {
    return new NextResponse("Invalid sessionId", { status: 400 });
  }

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      user: {
        clerkUserId: userId,
      },
    },
    select: {
      id: true,
      userId: true,
      mode: true,
      debateStatus: true,
      debateStartedAt: true,
      debateDurationPreset: true,
    },
  });

  if (!session) return new NextResponse("Session not found", { status: 404 });

  if (session.mode === "DEBATE") {
    if (session.debateStatus === "COMPLETED") {
      return new NextResponse("This debate has already ended.", {
        status: 409,
      });
    }

    const remainingSeconds = getDebateTimeRemainingSeconds({
      startedAt: session.debateStartedAt,
      durationPreset: session.debateDurationPreset,
    });

    if (remainingSeconds !== null && remainingSeconds <= 0) {
      await finalizeDebateSession({ sessionId: session.id });
      return new NextResponse("This debate has already ended.", {
        status: 409,
      });
    }
  }

  // last user message
  const lastUserMessage = await prisma.message.findFirst({
    where: {
      sessionId: session.id,
      role: "USER",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      attachments: true,
    },
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
    userAttachments: normalizeImageAttachments(lastUserMessage.attachments),
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
