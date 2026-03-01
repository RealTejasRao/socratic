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

  const previousMessagesRaw = await prisma.message.findMany({
    where: {
      sessionId: activeSessionId!,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 30,
    select: {
      role: true,
      content: true,
    },
  });

  // Reverse
  const previousMessages = previousMessagesRaw.reverse();

  const conversationHistory = previousMessages.map((msg) => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content,
  }));

  // open ai call outside transcation
  const stream = await openai.chat.completions.stream({
    model: process.env['OPENAI_CHAT_MODEL']!,
    messages: [
      {
        role: "system",
        content: SOCRATIC_SYSTEM_PROMPT,
      },
      ...conversationHistory,
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  let assistantText = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices[0]?.delta?.content;
        if (token) {
          assistantText += token;
          controller.enqueue(new TextEncoder().encode(token));
        }
      }

      controller.close();

    
      await prisma.$transaction(async (tx) => {
        const userMessage = await tx.message.create({
          data: {
            sessionId: activeSessionId!,
            role: "USER",
            content,
          },
        });

        await tx.message.create({
          data: {
            sessionId: activeSessionId!,
            role: "ASSISTANT",
            content: assistantText,
          },
        });

        await tx.chatSession.update({
          where: { id: activeSessionId! },
          data: {
            lastActivityAt: now,
            expiresAt,
          },
        });
      });
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
