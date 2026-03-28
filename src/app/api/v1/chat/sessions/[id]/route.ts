import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";

interface Props {
  params: Promise<{ id: string }>;
}

const SESSION_TITLE_MAX_LENGTH = 80;

export async function PATCH(req: Request, { params }: Props) {
  const { id } = await params;
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const rawTitle = body?.title;

  if (typeof rawTitle !== "string") {
    return new NextResponse("Invalid title", { status: 400 });
  }

  const title = rawTitle.trim().slice(0, SESSION_TITLE_MAX_LENGTH);

  if (!title) {
    return new NextResponse("Title cannot be empty", { status: 400 });
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
    select: { id: true },
  });

  if (!session) {
    return new NextResponse("Session not found", { status: 404 });
  }

  const updatedSession = await prisma.chatSession.update({
    where: { id },
    data: { title },
    select: {
      id: true,
      title: true,
    },
  });

  return NextResponse.json(updatedSession);
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
