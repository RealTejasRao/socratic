import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";
import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";
import { generateAssistantReply } from "src/server/chat/generate";

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const SESSION_TITLE_MAX_LENGTH = 80;

function deriveSessionTitleFromContent(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, SESSION_TITLE_MAX_LENGTH);
}

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
  const derivedTitle = deriveSessionTitleFromContent(content);

  let activeSessionId = sessionId;

  if (!activeSessionId) {
    const newSession = await prisma.chatSession.create({
      data: {
        userId: dbUser.id,
        title: derivedTitle,
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
      select: {
        id: true,
        title: true,
      },
    });

    if (!existingSession) {
      return new NextResponse("Session not found", { status: 404 });
    }

    if (!existingSession.title && derivedTitle) {
      await prisma.chatSession.update({
        where: { id: existingSession.id },
        data: { title: derivedTitle },
      });
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
