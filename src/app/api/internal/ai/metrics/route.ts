import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import {
  buildAnalyticsSnapshot,
  filterSinceDays,
} from "src/server/ai/analytics";

export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId")?.trim() || undefined;

  if (sessionId) {
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: dbUser.id,
      },
      select: { id: true },
    });
    if (!session) {
      return new NextResponse("Session not found", { status: 404 });
    }
  }

  const messages = await prisma.message.findMany({
    where: {
      role: "ASSISTANT",
      session: {
        userId: dbUser.id,
      },
      ...(sessionId ? { sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      validationScore: true,
      validationFlags: true,
      latencyMs: true,
      tokenIn: true,
      tokenOut: true,
      model: true,
    },
  });

  const window30 = filterSinceDays(messages, 30);
  const window7 = filterSinceDays(messages, 7);

  return NextResponse.json({
    scope: sessionId ? { sessionId } : { sessionId: null },
    last7Days: buildAnalyticsSnapshot(window7),
    last30Days: buildAnalyticsSnapshot(window30),
    lifetime: buildAnalyticsSnapshot(messages),
  });
}
