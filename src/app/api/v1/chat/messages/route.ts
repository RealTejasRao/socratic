import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";
import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";

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

  // 🔹 Fetch DB user
  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!dbUser) {
    return new NextResponse("User not found in DB", { status: 404 });
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);

  let activeSessionId = sessionId;

  // 🔹 Create or validate session
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

  // open ai call outside transcation
  const completion = await openai.chat.completions.create({
    model: process.env['OPENAI_CHAT_MODEL']!,
    messages: [
      {
        role: "system",
        content: SOCRATIC_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const assistantText =
    completion.choices[0]?.message?.content?.trim() ??
    "I'm not sure how to respond to that.";

  // 
  const result = await prisma.$transaction(async (tx) => {
    const userMessage = await tx.message.create({
      data: {
        sessionId: activeSessionId!,
        role: "USER",
        content,
      },
    });

    const assistantMessage = await tx.message.create({
      data: {
        sessionId: activeSessionId!,
        role: "ASSISTANT",
        content: assistantText,
        model: completion.model,
        tokenIn: completion.usage?.prompt_tokens ?? null,
        tokenOut: completion.usage?.completion_tokens ?? null,
      },
    });

    await tx.chatSession.update({
      where: { id: activeSessionId! },
      data: {
        lastActivityAt: now,
        expiresAt,
      },
    });

    return {
      userMessage,
      assistantMessage,
      sessionId: activeSessionId!,
    };
  });

  return NextResponse.json({
    sessionId: result.sessionId,
    userMessage: result.userMessage,
    assistantMessage: result.assistantMessage,
  });
}
