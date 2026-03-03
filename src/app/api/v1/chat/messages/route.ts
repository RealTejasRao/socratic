import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";
import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";
import { generateAssistantReply } from "src/server/chat/generate";

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
    const newSession = await prisma.chatSession.create({
      data: {
        userId: dbUser.id,
        expiresAt,
        lastActivityAt: now,
      },
    });

    activeSessionId = newSession.id;
  } else {
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

  const readable = await generateAssistantReply({
    sessionId: activeSessionId!,
    userContent: content,
    now,
    expiresAt,
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Session-Id": activeSessionId!,
    },
  });
}
