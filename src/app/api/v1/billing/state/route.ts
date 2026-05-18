import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "src/server/db/client";
import {
  BILLING_KEYS,
  PLAN_LIMITS,
  PREMIUM_FEATURES,
} from "src/lib/billing";
import {
  getUserBillingStateByClerkId,
  hasPremiumFeature,
  resolveUserTierLabel,
} from "src/server/billing/access";
import type { BillingStateResponse } from "src/types/billing";

function getUtcDayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const billing = await getUserBillingStateByClerkId(clerkUserId);
  if (!billing) {
    return new NextResponse("User not found", { status: 404 });
  }

  const now = new Date();
  const periodStart = getUtcDayStart(now);
  const resetsAt = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);

  const [messageUsage, imageUsage] = await Promise.all([
    prisma.usageCounter.findUnique({
      where: {
        userId_usageKey_periodStart: {
          userId: billing.userId,
          usageKey: BILLING_KEYS.dailyMessages,
          periodStart,
        },
      },
      select: { count: true },
    }),
    prisma.usageCounter.findUnique({
      where: {
        userId_usageKey_periodStart: {
          userId: billing.userId,
          usageKey: BILLING_KEYS.dailyImageUploads,
          periodStart,
        },
      },
      select: { count: true },
    }),
  ]);

  const dailyMessagesUsed = messageUsage?.count ?? 0;
  const dailyMessagesRemaining = billing.isPremium
    ? null
    : Math.max(PLAN_LIMITS.FREE_DAILY_MESSAGES - dailyMessagesUsed, 0);
  const dailyImageUploadsUsed = imageUsage?.count ?? 0;
  const dailyImageUploadsRemaining = billing.isPremium
    ? null
    : Math.max(PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS - dailyImageUploadsUsed, 0);

  const payload: BillingStateResponse = {
    planTier: billing.planTier,
    planStatus: billing.planStatus as BillingStateResponse["planStatus"],
    isPremium: billing.isPremium,
    tierLabel: resolveUserTierLabel(billing.planTier) as "Free" | "Socratic+",
    dodoCustomerId: billing.dodoCustomerId,
    subscriptionCurrentPeriodEnd:
      billing.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
    subscriptionCancelAtPeriodEnd: billing.subscriptionCancelAtPeriodEnd,
    usage: {
      dailyMessageLimit: billing.isPremium
        ? Number.MAX_SAFE_INTEGER
        : PLAN_LIMITS.FREE_DAILY_MESSAGES,
      dailyMessagesUsed,
      dailyMessagesRemaining,
      dailyImageUploadLimit: billing.isPremium
        ? Number.MAX_SAFE_INTEGER
        : PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS,
      dailyImageUploadsUsed,
      dailyImageUploadsRemaining,
      resetsAt: resetsAt.toISOString(),
    },
    features: {
      debateMode: hasPremiumFeature(billing, PREMIUM_FEATURES.debateMode),
      detailedDebateFeedback: hasPremiumFeature(
        billing,
        PREMIUM_FEATURES.detailedDebateFeedback,
      ),
      ruthlessTone: hasPremiumFeature(billing, PREMIUM_FEATURES.ruthlessTone),
      globalMemory: hasPremiumFeature(billing, PREMIUM_FEATURES.globalMemory),
      earlyAccess: hasPremiumFeature(billing, PREMIUM_FEATURES.earlyAccess),
    },
  };

  return NextResponse.json(payload);
}
