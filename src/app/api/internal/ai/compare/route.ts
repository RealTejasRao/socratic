import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "src/server/db/client";
import {
  buildAnalyticsSnapshot,
  extractPromptVersion,
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
  const fromVersion = searchParams.get("from")?.trim();
  const toVersion = searchParams.get("to")?.trim();
  const daysRaw = Number.parseInt(searchParams.get("days") ?? "90", 10);
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? daysRaw : 90;

  if (!fromVersion || !toVersion) {
    return new NextResponse("Missing from/to prompt version", { status: 400 });
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const messages = await prisma.message.findMany({
    where: {
      role: "ASSISTANT",
      createdAt: { gte: cutoff },
      session: {
        userId: dbUser.id,
      },
      OR: [
        { model: { contains: `(${fromVersion})` } },
        { model: { contains: `(${toVersion})` } },
      ],
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

  const fromMessages = messages.filter(
    (message) => extractPromptVersion(message.model) === fromVersion,
  );
  const toMessages = messages.filter(
    (message) => extractPromptVersion(message.model) === toVersion,
  );

  const fromSnapshot = buildAnalyticsSnapshot(fromMessages);
  const toSnapshot = buildAnalyticsSnapshot(toMessages);

  return NextResponse.json({
    periodDays: days,
    from: {
      version: fromVersion,
      ...fromSnapshot,
    },
    to: {
      version: toVersion,
      ...toSnapshot,
    },
    delta: {
      avgValidationScore:
        (toSnapshot.avgValidationScore ?? 0) - (fromSnapshot.avgValidationScore ?? 0),
      avgLatencyMs: (toSnapshot.avgLatencyMs ?? 0) - (fromSnapshot.avgLatencyMs ?? 0),
      avgTokenIn: (toSnapshot.avgTokenIn ?? 0) - (fromSnapshot.avgTokenIn ?? 0),
      avgTokenOut: (toSnapshot.avgTokenOut ?? 0) - (fromSnapshot.avgTokenOut ?? 0),
      sampleSize: {
        from: fromSnapshot.totalResponses,
        to: toSnapshot.totalResponses,
      },
    },
  });
}
