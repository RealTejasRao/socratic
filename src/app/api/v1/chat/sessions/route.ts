import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { serializeSessionMeta } from "src/server/chat/session-meta";

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true }
  });

  if (!dbUser) {
    return new NextResponse("User not found in DB", { status: 404 });
  }

  const sessions = await prisma.chatSession.findMany({
    where: { userId: dbUser.id },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      title: true,
      mode: true,
      status: true,
      debateTone: true,
      debateDurationPreset: true,
      debateHasTimer: true,
      debateTopic: true,
      debateTopicSource: true,
      userDebateSide: true,
      aiDebateSide: true,
      debateStatus: true,
      debateStartedAt: true,
      debateEndedAt: true,
      debateWinner: true,
      debateVerdictSummary: true,
      debateSummary: true,
      lastActivityAt: true,
      createdAt: true
    }
  });

  return NextResponse.json(sessions.map((session) => ({
    ...session,
    meta: serializeSessionMeta(session),
  })));
}
