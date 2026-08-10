import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import { ensureUserForClerkId } from "src/server/auth/ensure-user";

const REFERRAL_CODE_REGEX = /^[a-zA-Z0-9_-]{2,80}$/;

function normalizeReferralCode(code: string) {
  return code.toUpperCase();
}

export async function POST(request: Request) {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = (await request.json()) as { code?: unknown };
    const rawCode = typeof body.code === "string" ? body.code : "";
    const code = rawCode.trim();
    const normalizedCode = normalizeReferralCode(code);

    if (!REFERRAL_CODE_REGEX.test(code)) {
      return NextResponse.json(
        {
          message:
            "Enter a referral code using letters, numbers, hyphens, or underscores.",
        },
        { status: 400 },
      );
    }

    const [existingDbUser, ambassadorCode] = await Promise.all([
      prisma.user.findUnique({
        where: { clerkUserId },
        select: { id: true },
      }),
      prisma.ambassadorReferralCode.findUnique({
        where: { normalizedCode },
        select: { id: true, code: true },
      }),
    ]);

    if (!ambassadorCode) {
      return NextResponse.json(
        { message: "Invalid ambassador code." },
        { status: 404 },
      );
    }

    const dbUser = existingDbUser ?? (await ensureUserForClerkId(clerkUserId));
    const userAgent = request.headers.get("user-agent")?.slice(0, 500) ?? null;

    await prisma.referralCodeSubmission.create({
      data: {
        userId: dbUser.id,
        ambassadorCodeId: ambassadorCode.id,
        clerkUserId,
        code: ambassadorCode.code,
        userAgent,
      },
    });

    return NextResponse.json(
      { message: "Referral support recorded." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to record referral support", { error });
    return NextResponse.json(
      { message: "Unable to record referral support right now." },
      { status: 500 },
    );
  }
}
