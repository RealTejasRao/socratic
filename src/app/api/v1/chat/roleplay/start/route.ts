import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import { createRoleplaySession } from "src/server/roleplay/service";
import { isRoleplayPhilosopherId } from "src/lib/roleplay";

export async function POST(req: Request) {
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

  const body = await req.json();
  const philosopherId = body?.philosopherId;

  if (!isRoleplayPhilosopherId(philosopherId)) {
    return new NextResponse("Invalid philosopher", { status: 400 });
  }

  const session = await createRoleplaySession({
    userId: dbUser.id,
    philosopherId,
  });

  return NextResponse.json(session);
}
