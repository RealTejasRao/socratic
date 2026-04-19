import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  DEBATE_TOPIC_MAX_CHARS,
  type DebateDurationPreset,
  type DebateTone,
} from "src/lib/debate";
import type { DebateTopicSource } from "src/types/chat";
import { prisma } from "src/server/db/client";
import {
  createDebateSession,
  finalizeDebateSession,
  getDebateTimeRemainingSeconds,
  validateDebateTopic,
} from "src/server/debate/service";
import {
  consumeUserRateLimit,
  createRateLimitHeaders,
  getRequestIp,
} from "src/server/security/rate-limit";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rateLimit = await consumeUserRateLimit({
    scope: "debate:start",
    userId: clerkUserId,
    ip: getRequestIp(req),
    limit: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        reason:
          "Too many debate start requests. Please wait a moment and try again.",
      },
      {
        status: 429,
        headers: createRateLimitHeaders(rateLimit),
      },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  const activeDebates = await prisma.chatSession.findMany({
    where: {
      userId: dbUser.id,
      mode: "DEBATE",
      debateStatus: "ACTIVE",
    },
    select: {
      id: true,
      debateStartedAt: true,
      debateDurationPreset: true,
    },
  });

  let hasActiveDebate = false;

  for (const debate of activeDebates) {
    const remainingSeconds = getDebateTimeRemainingSeconds({
      startedAt: debate.debateStartedAt,
      durationPreset: debate.debateDurationPreset,
    });

    if (remainingSeconds !== null && remainingSeconds <= 0) {
      await finalizeDebateSession({ sessionId: debate.id });
      continue;
    }

    hasActiveDebate = true;
    break;
  }

  if (hasActiveDebate) {
    return NextResponse.json(
      {
        reason:
          "You already have an active debate. Finish it before starting a new one.",
      },
      { status: 409 },
    );
  }

  const body = await req.json();
  const tone = body?.tone;
  const durationPreset = body?.durationPreset;
  const topic = typeof body?.topic === "string" ? body.topic : "";
  const topicSource = body?.topicSource;
  const userSide =
    typeof body?.userSide === "string" ? body.userSide.trim() : "";
  const aiSide = typeof body?.aiSide === "string" ? body.aiSide.trim() : "";

  if (
    typeof tone !== "string" ||
    typeof durationPreset !== "string" ||
    typeof topicSource !== "string" ||
    !userSide ||
    !aiSide
  ) {
    return new NextResponse("Invalid debate setup", { status: 400 });
  }

  if (topic.trim().length > DEBATE_TOPIC_MAX_CHARS) {
    return NextResponse.json(
      {
        reason: `Keep the topic under ${DEBATE_TOPIC_MAX_CHARS} characters.`,
      },
      { status: 400 },
    );
  }

  const topicValidation = await validateDebateTopic(topic);

  if (!topicValidation.isValid) {
    return NextResponse.json(topicValidation, { status: 400 });
  }

  const session = await createDebateSession({
    userId: dbUser.id,
    tone: tone as DebateTone,
    durationPreset: durationPreset as DebateDurationPreset,
    topic: topicValidation.normalizedTopic,
    topicSource: topicSource as DebateTopicSource,
    userSide,
    aiSide,
  });

  return NextResponse.json(session);
}
