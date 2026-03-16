import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";

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
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "20", 10);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

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

  const traces = await prisma.retrievalTrace.findMany({
    where: {
      userId: dbUser.id,
      ...(sessionId ? { sessionId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      sessionId: true,
      sourceMessageId: true,
      rawUserQuery: true,
      retrievalQuery: true,
      retrievalLatencyMs: true,
      vectorCandidates: true,
      lexicalCandidates: true,
      fusedCandidates: true,
      rerankedCandidates: true,
      selectedPassages: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    count: traces.length,
    traces,
  });
}
