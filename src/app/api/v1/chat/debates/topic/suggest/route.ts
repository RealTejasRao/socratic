import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { DebateDurationPreset, DebateTone } from "@prisma/client";
import { generateDebateTopicSuggestions } from "src/server/debate/service";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const tone = body?.tone;
  const durationPreset = body?.durationPreset;

  if (
    typeof tone !== "string" ||
    typeof durationPreset !== "string"
  ) {
    return new NextResponse("Invalid debate config", { status: 400 });
  }

  const topics = await generateDebateTopicSuggestions({
    tone: tone as DebateTone,
    durationPreset: durationPreset as DebateDurationPreset,
  });

  return NextResponse.json({ topics });
}
