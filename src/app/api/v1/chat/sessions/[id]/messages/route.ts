import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";

interface Params {
  params: {
    id: string;
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await context.params;

  console.log("SESSION ID RECEIVED:", sessionId);

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

  const session = await prisma.chatSession.findFirst({
    where: {
      id: sessionId,
      userId: dbUser.id
    },
    select: { id: true }
  });

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true
    }
  });

  return NextResponse.json(messages);
}