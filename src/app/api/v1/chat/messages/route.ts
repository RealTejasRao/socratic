import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { generateAssistantReply } from "src/server/chat/generate";
import { generateSessionTitle } from "src/server/chat/generate-session-title";
import {
  finalizeDebateSession,
  getDebateTimeRemainingSeconds,
} from "src/server/debate/service";
import {
  consumeUserRateLimit,
  createRateLimitHeaders,
  getRequestIp,
} from "src/server/security/rate-limit";
import {
  consumeDailyMessageQuota,
  getUserBillingStateByClerkId,
  normalizeSocraticToneForPlan,
} from "src/server/billing/access";
import type { ChatImageAttachment } from "src/types/chat";
import { isSocraticTone, type SocraticTone } from "src/lib/socratic";
import {
  getRoleplayPhilosopherConfig,
  isRoleplayPhilosopherId,
} from "src/lib/roleplay";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const MAX_ATTACHMENTS = 3;
const MAX_CONTENT_CHARS = 3000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
    value.dataUrl.length > 0 &&
    value.dataUrl.length <= 4096 &&
    typeof value.mimeType === "string" &&
    value.mimeType.startsWith("image/") &&
    typeof value.name === "string" &&
    value.name.length > 0 &&
    value.name.length <= 260 &&
    (!("bytes" in value) ||
      typeof value.bytes !== "number" ||
      (Number.isFinite(value.bytes) &&
        value.bytes > 0 &&
        value.bytes <= MAX_IMAGE_BYTES)),
  );
}

export async function POST(req: Request) {
  const requestStartedAtMs = Date.now();
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rateLimit = await consumeUserRateLimit({
    scope: "chat:messages",
    userId: clerkUserId,
    ip: getRequestIp(req),
    limit: 60,
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

  const generationRateLimit = await consumeUserRateLimit({
    scope: "chat:generation",
    userId: clerkUserId,
    ip: getRequestIp(req),
    limit: 24,
    windowMs: 60_000,
  });

  if (!generationRateLimit.allowed) {
    return new NextResponse(
      "Generation rate limit reached. Please slow down and try again shortly.",
      {
        status: 429,
        headers: createRateLimitHeaders(generationRateLimit),
      },
    );
  }

  const body = await req.json();

  const { sessionId, content } = body as {
    sessionId?: string;
    content?: string;
    attachments?: unknown;
    webSearch?: unknown;
    mode?: unknown;
    roleplayPhilosopherId?: unknown;
    socraticTone?: unknown;
  };
  const attachments = Array.isArray(body?.attachments)
    ? body.attachments.filter(isValidAttachment).slice(0, MAX_ATTACHMENTS)
    : [];
  const forceWebSearch = body?.webSearch === true;
  const requestedSocraticTone = isSocraticTone(body?.socraticTone)
    ? (body.socraticTone as SocraticTone)
    : "SIMPLE_CLEAR";
  const billing = await getUserBillingStateByClerkId(clerkUserId);

  if (!billing) {
    return new NextResponse("User not found in DB", { status: 404 });
  }

  if (typeof content !== "string") {
    return new NextResponse("Invalid content", { status: 400 });
  }
  if (content.length > MAX_CONTENT_CHARS) {
    return new NextResponse(
      `Message is too long. Max ${MAX_CONTENT_CHARS} characters.`,
      {
        status: 400,
      },
    );
  }
  if (!content.trim() && attachments.length === 0) {
    return new NextResponse("Message must include text or image", {
      status: 400,
    });
  }
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  let activeSessionId = sessionId;
  let activeUserId: string;
  let activeSessionMode: "SOCRATIC" | "DEBATE" | "ROLEPLAY" = "SOCRATIC";

  if (!activeSessionId) {
    const requestedMode = body?.mode;
    const roleplayPhilosopherId = body?.roleplayPhilosopherId;
    const roleplayPhilosopher =
      requestedMode === "ROLEPLAY" &&
      isRoleplayPhilosopherId(roleplayPhilosopherId)
        ? getRoleplayPhilosopherConfig(roleplayPhilosopherId)
        : null;
    const derivedTitle =
      (await generateSessionTitle(content)) ??
      (attachments.length > 0 ? "Image upload" : null);

    const newSession = await prisma.chatSession.create({
      data: {
        userId: billing.userId,
        title: roleplayPhilosopher
          ? `Talk with ${roleplayPhilosopher.name}`
          : derivedTitle,
        ...(roleplayPhilosopher
          ? {
              mode: "ROLEPLAY" as const,
              roleplayMeta: {
                characterId: roleplayPhilosopher.id,
                philosopherId: roleplayPhilosopher.id,
              },
            }
          : {}),
        expiresAt,
        lastActivityAt: now,
      },
    });

    activeSessionId = newSession.id;
    activeUserId = billing.userId;
    activeSessionMode = roleplayPhilosopher ? "ROLEPLAY" : "SOCRATIC";
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

    activeSessionMode = existingSession.mode;

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

  const quota = await consumeDailyMessageQuota({
    userId: activeUserId,
    billing,
    now,
  });

  if (!quota.allowed) {
    return NextResponse.json(
      {
        reason:
          "Daily free limit reached. Upgrade to Socratic+ for unlimited messages.",
        dailyLimit: quota.limit,
        used: quota.used,
        resetsAt: quota.resetsAt?.toISOString() ?? null,
      },
      {
        status: 402,
      },
    );
  }

  const toneForPlan = normalizeSocraticToneForPlan({
    requestedTone: requestedSocraticTone,
    billing,
  });

  const generationResult = await generateAssistantReply({
    userId: activeUserId,
    sessionId: activeSessionId!,
    userContent: content,
    userAttachments: attachments,
    forceWebSearch,
    socraticTone: toneForPlan,
    now,
    expiresAt,
  });
  const prepareMs = Date.now() - requestStartedAtMs;

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "X-Session-Id": activeSessionId!,
    "X-Server-Prepare-Ms": String(prepareMs),
    "X-AI-Context-Ms": String(generationResult.debug.contextMs),
    "X-AI-Web-Search-Ms": String(generationResult.debug.webSearchMs ?? 0),
    "X-AI-Prestream-Ms": String(generationResult.debug.preStreamTotalMs),
    "X-AI-Stream-Setup-Ms": String(generationResult.debug.streamSetupMs),
  };

  if (activeSessionMode !== "ROLEPLAY") {
    headers["X-AI-Retrieval-Ms"] = String(generationResult.debug.retrievalMs ?? 0);
  }

  return new Response(generationResult.readable, { headers });
}
