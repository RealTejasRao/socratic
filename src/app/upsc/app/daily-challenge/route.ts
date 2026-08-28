import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureUserForClerkId } from "@/src/server/auth/ensure-user";
import { prisma } from "@/src/server/db/client";
import { getTodayUpscChallenge } from "../daily-challenges";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function buildSessionTitle(category: string, question: string) {
  const title = `${category}: ${question}`.replace(/\s+/g, " ").trim();

  return title.length > 140 ? `${title.slice(0, 137).trim()}...` : title;
}

export async function POST() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const challenge = await getTodayUpscChallenge();

  if (!challenge) {
    return new NextResponse("Daily challenge not found", { status: 404 });
  }

  const user = await ensureUserForClerkId(clerkUserId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  const session = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.chatSession.create({
      data: {
        userId: user.id,
        mode: "SOCRATIC",
        title: buildSessionTitle(challenge.category, challenge.question),
        expiresAt,
        lastActivityAt: now,
      },
      select: {
        id: true,
      },
    });

    await tx.message.create({
      data: {
        sessionId: createdSession.id,
        role: "ASSISTANT",
        content: challenge.question,
        createdAt: now,
      },
    });

    return createdSession;
  });

  return NextResponse.json({
    sessionId: session.id,
  });
}
