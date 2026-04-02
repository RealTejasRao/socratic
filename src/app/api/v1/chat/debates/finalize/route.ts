import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { finalizeDebateSession } from "src/server/debate/service";

export async function POST(req: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";

  if (!sessionId) {
    return new NextResponse("Invalid sessionId", { status: 400 });
  }

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      user: {
        clerkUserId,
      },
    },
    select: { id: true },
  });

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const finalized = await finalizeDebateSession({ sessionId: session.id });

  if (!finalized) {
    return new NextResponse("Debate session not found", { status: 404 });
  }

  return NextResponse.json(finalized);
}
