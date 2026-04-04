import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";
import { invalidateConversationMemory } from "src/server/ai/memory-store";
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
const MAX_CONTENT_CHARS = 3000;

function normalizeImageAttachments(value: unknown): ChatImageAttachment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
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
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rateLimit = await consumeUserRateLimit({
    scope: "chat:edit",
    userId: clerkUserId,
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

  if (newContent.length > MAX_CONTENT_CHARS) {
    return new NextResponse(
      `Message is too long. Max ${MAX_CONTENT_CHARS} characters.`,
      {
        status: 400,
      },
    );
  }

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      user: {
        clerkUserId,
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

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  if (session.mode === "DEBATE") {
    if (session.debateStatus === "COMPLETED") {
      return new NextResponse(
        "Debate messages cannot be edited after the debate ends.",
        {
          status: 409,
        },
      );
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

  const targetMessage = await prisma.message.findFirst({
    where: {
      id: messageId,
      sessionId: session.id,
      role: "USER",
    },
    select: {
      id: true,
      createdAt: true,
      attachments: true,
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

  await invalidateConversationMemory(session.id);

  const generationResult = await generateAssistantReply({
    userId: session.userId,
    sessionId: session.id,
    userContent: newContent.trim(),
    userAttachments: normalizeImageAttachments(targetMessage.attachments),
    now,
    expiresAt,
    persistUserMessage: false,
    appendUserMessageToPrompt: false,
    sourceUserMessageId: targetMessage.id,
    runInsightExtraction: true,
    replaceBeliefsForSourceMessage: true,
    maxTokens: 300,
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
