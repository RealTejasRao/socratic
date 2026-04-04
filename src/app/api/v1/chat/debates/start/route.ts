import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { DebateTopicSource } from "@prisma/client";
import {
  DEBATE_TOPIC_MAX_CHARS,
  type DebateDurationPreset,
  type DebateTone,
} from "src/lib/debate";
import { prisma } from "src/server/db/client";
import {
  createDebateSession,
  validateDebateTopic,
} from "src/server/debate/service";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
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
