import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(req: Request) {
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

  // Get DB user
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!dbUser) {
    return new NextResponse("User not found in DB", { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  let activeSessionId = sessionId;

  if (!activeSessionId) {
    // Create new session
    const newSession = await prisma.chatSession.create({
      data: {
        userId: dbUser.id,
        expiresAt,
        lastActivityAt: now,
      },
    });

    activeSessionId = newSession.id;
  } else {
    // Ensure session belongs to user
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        id: activeSessionId,
        userId: dbUser.id,
      },
    });

    if (!existingSession) {
      return new NextResponse("Session not found", { status: 404 });
    }
  }

  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.message.create({
      data: {
        sessionId: activeSessionId!,
        role: "USER",
        content,
      },
    });

    await tx.chatSession.update({
      where: { id: activeSessionId! },
      data: {
        lastActivityAt: now,
        expiresAt,
      },
    });

    return createdMessage;
  });

  return NextResponse.json({
    sessionId: activeSessionId,
    messageId: message.id,
  });
}
