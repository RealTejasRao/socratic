import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { DebateDurationPreset, DebateTone } from "src/lib/debate";
import { generateDebateTopicSuggestions } from "src/server/debate/service";
import { prisma } from "src/server/db/client";

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
  const tone = body?.tone;
  const durationPreset = body?.durationPreset;

  if (typeof tone !== "string" || typeof durationPreset !== "string") {
    return new NextResponse("Invalid debate config", { status: 400 });
  }

  const topics = await generateDebateTopicSuggestions({
    tone: tone as DebateTone,
    durationPreset: durationPreset as DebateDurationPreset,
    userId: dbUser.id,
  });

  return NextResponse.json({ topics });
}
