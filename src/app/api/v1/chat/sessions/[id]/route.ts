import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function DELETE(_: Request, { params }: Props) {
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
  });

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  await prisma.chatSession.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
