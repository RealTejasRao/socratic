import "server-only";
import { BillingSubscriptionStatus, PlanTier } from "@prisma/client";
import { prisma } from "src/server/db/client";
import {
  BILLING_KEYS,
  PLAN_LIMITS,
  PLAN_TIERS,
  PREMIUM_FEATURES,
  type PremiumFeatureKey,
  isPremiumTierValue,
} from "src/lib/billing";

export type UserBillingState = {
  userId: string;
  clerkUserId: string;
  planTier: PlanTier;
  planStatus: BillingSubscriptionStatus;
  isPremium: boolean;
  dodoCustomerId: string | null;
  subscriptionCurrentPeriodEnd: Date | null;
  subscriptionCancelAtPeriodEnd: boolean;
};

export function hasPremiumFeature(
  billing: Pick<UserBillingState, "isPremium">,
  feature: PremiumFeatureKey,
) {
  if (billing.isPremium) {
    return true;
  }

  switch (feature) {
    case PREMIUM_FEATURES.debateMode:
    case PREMIUM_FEATURES.detailedDebateFeedback:
    case PREMIUM_FEATURES.ruthlessTone:
    case PREMIUM_FEATURES.globalMemory:
    case PREMIUM_FEATURES.earlyAccess:
      return false;
    default:
      return false;
  }
}

export function getConversationHistoryWindow(billing: Pick<UserBillingState, "isPremium">) {
  return billing.isPremium
    ? PLAN_LIMITS.PREMIUM_HISTORY_WINDOW
    : PLAN_LIMITS.FREE_HISTORY_WINDOW;
}

export function getVisibleSessionsLimit(billing: Pick<UserBillingState, "isPremium">) {
  return billing.isPremium
    ? PLAN_LIMITS.PREMIUM_VISIBLE_SESSIONS
    : PLAN_LIMITS.FREE_VISIBLE_SESSIONS;
}

export function normalizeSocraticToneForPlan(params: {
  requestedTone: "BALANCED" | "RUTHLESS_BLUNT" | "SIMPLE_CLEAR";
  billing: Pick<UserBillingState, "isPremium">;
}) {
  if (
    params.requestedTone === "RUTHLESS_BLUNT" &&
    !hasPremiumFeature(params.billing, PREMIUM_FEATURES.ruthlessTone)
  ) {
    return "SIMPLE_CLEAR";
  }

  return params.requestedTone;
}

export async function getUserBillingStateByClerkId(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: {
      id: true,
      clerkUserId: true,
      planTier: true,
      planStatus: true,
      dodoCustomerId: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCancelAtPeriodEnd: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    clerkUserId: user.clerkUserId,
    planTier: user.planTier,
    planStatus: user.planStatus,
    isPremium: isPremiumTierValue(user.planTier),
    dodoCustomerId: user.dodoCustomerId ?? null,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
    subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
  } satisfies UserBillingState;
}

export async function getUserBillingStateByUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkUserId: true,
      planTier: true,
      planStatus: true,
      dodoCustomerId: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCancelAtPeriodEnd: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    userId: user.id,
    clerkUserId: user.clerkUserId,
    planTier: user.planTier,
    planStatus: user.planStatus,
    isPremium: isPremiumTierValue(user.planTier),
    dodoCustomerId: user.dodoCustomerId ?? null,
    subscriptionCurrentPeriodEnd: user.subscriptionCurrentPeriodEnd ?? null,
    subscriptionCancelAtPeriodEnd: user.subscriptionCancelAtPeriodEnd,
  } satisfies UserBillingState;
}

function getUtcDayStart(now: Date) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function consumeDailyFreeQuota(params: {
  userId: string;
  usageKey: string;
  limit: number;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const periodStart = getUtcDayStart(now);
  const resetsAt = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const counter = await tx.usageCounter.upsert({
      where: {
        userId_usageKey_periodStart: {
          userId: params.userId,
          usageKey: params.usageKey,
          periodStart,
        },
      },
      create: {
        userId: params.userId,
        usageKey: params.usageKey,
        periodStart,
        count: 0,
      },
      update: {},
      select: {
        id: true,
        count: true,
      },
    });

    if (counter.count >= params.limit) {
      return {
        allowed: false,
        limit: params.limit,
        used: counter.count,
        remaining: 0,
        resetsAt,
      };
    }

    const incrementResult = await tx.usageCounter.updateMany({
      where: {
        id: counter.id,
        count: { lt: params.limit },
      },
      data: {
        count: { increment: 1 },
      },
    });

    if (incrementResult.count === 0) {
      const latest = await tx.usageCounter.findUnique({
        where: { id: counter.id },
        select: { count: true },
      });
      const latestCount = latest?.count ?? params.limit;

      return {
        allowed: false,
        limit: params.limit,
        used: latestCount,
        remaining: 0,
        resetsAt,
      };
    }

    const nextUsed = counter.count + 1;

    return {
      allowed: true,
      limit: params.limit,
      used: nextUsed,
      remaining: Math.max(params.limit - nextUsed, 0),
      resetsAt,
    };
  });
}

export async function consumeDailyMessageQuota(params: {
  userId: string;
  billing: Pick<UserBillingState, "isPremium">;
  now?: Date;
}) {
  if (params.billing.isPremium) {
    return {
      allowed: true,
      limit: Number.POSITIVE_INFINITY,
      used: 0,
      remaining: Number.POSITIVE_INFINITY,
      resetsAt: null,
    };
  }

  return consumeDailyFreeQuota({
    userId: params.userId,
    usageKey: BILLING_KEYS.dailyMessages,
    limit: PLAN_LIMITS.FREE_DAILY_MESSAGES,
    ...(params.now ? { now: params.now } : {}),
  });
}

export async function consumeDailyImageUploadQuota(params: {
  userId: string;
  billing: Pick<UserBillingState, "isPremium">;
  now?: Date;
}) {
  if (params.billing.isPremium) {
    return {
      allowed: true,
      limit: Number.POSITIVE_INFINITY,
      used: 0,
      remaining: Number.POSITIVE_INFINITY,
      resetsAt: null,
    };
  }

  return consumeDailyFreeQuota({
    userId: params.userId,
    usageKey: BILLING_KEYS.dailyImageUploads,
    limit: PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS,
    ...(params.now ? { now: params.now } : {}),
  });
}

export function resolveUserTierLabel(planTier: PlanTier) {
  if (planTier === PLAN_TIERS.PREMIUM_MONTHLY || planTier === PLAN_TIERS.PREMIUM_ANNUAL) {
    return "Socratic+";
  }

  return "Free";
}
