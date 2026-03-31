import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { createShareToken } from "src/server/chat/share-token";

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const { id } = await params;
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

  const session = await prisma.chatSession.findFirst({
    where: {
      id,
      userId: dbUser.id,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const token = createShareToken(session.id);
  const origin = request.nextUrl.origin;
  const shareUrl = `${origin}/share/${token}`;

  return NextResponse.json({
    shareUrl,
    title: session.title || "Socratic AI chat",
  });
}
