export const PLAN_TIERS = {
  FREE: "FREE",
  PREMIUM_MONTHLY: "PREMIUM_MONTHLY",
  PREMIUM_ANNUAL: "PREMIUM_ANNUAL",
} as const;

export type PlanTier = (typeof PLAN_TIERS)[keyof typeof PLAN_TIERS];

export const BILLING_SUBSCRIPTION_STATUSES = {
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  ON_HOLD: "ON_HOLD",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED",
  EXPIRED: "EXPIRED",
} as const;

export type BillingSubscriptionStatus =
  (typeof BILLING_SUBSCRIPTION_STATUSES)[keyof typeof BILLING_SUBSCRIPTION_STATUSES];

export const SOCRATIC_PLUS_NAME = "Socratic+";

export const DODO_PRODUCTS = {
  monthly: "DODO_PRODUCT_MONTHLY",
  annual: "DODO_PRODUCT_ANNUAL",
} as const;

export const FREE_DAILY_QUOTAS = {
  messages: 25,
  imageUploads: 4,
} as const;

export const PLAN_LIMITS = {
  FREE_DAILY_MESSAGES: FREE_DAILY_QUOTAS.messages,
  FREE_DAILY_IMAGE_UPLOADS: FREE_DAILY_QUOTAS.imageUploads,
  FREE_HISTORY_WINDOW: 20,
  PREMIUM_HISTORY_WINDOW: 80,
  FREE_VISIBLE_SESSIONS: 30,
  PREMIUM_VISIBLE_SESSIONS: 300,
} as const;

export const BILLING_KEYS = {
  dailyMessages: "chat:messages:daily",
  dailyImageUploads: "chat:image_uploads:daily",
} as const;

export const PREMIUM_FEATURES = {
  debateMode: "debate_mode",
  detailedDebateFeedback: "detailed_debate_feedback",
  ruthlessTone: "ruthless_tone",
  globalMemory: "global_memory",
  earlyAccess: "early_access",
} as const;

export type PremiumFeatureKey =
  (typeof PREMIUM_FEATURES)[keyof typeof PREMIUM_FEATURES];

export function isPremiumTier(planTier: PlanTier) {
  return (
    planTier === PLAN_TIERS.PREMIUM_MONTHLY ||
    planTier === PLAN_TIERS.PREMIUM_ANNUAL
  );
}

export function isPremiumTierValue(planTier: string | null | undefined) {
  return isPremiumTier((planTier ?? PLAN_TIERS.FREE) as PlanTier);
}

export function resolvePlanTierFromProductId(productId: string): PlanTier {
  const monthly = process.env[DODO_PRODUCTS.monthly];
  const annual = process.env[DODO_PRODUCTS.annual];

  if (annual && productId === annual) {
    return PLAN_TIERS.PREMIUM_ANNUAL;
  }

  if (monthly && productId === monthly) {
    return PLAN_TIERS.PREMIUM_MONTHLY;
  }

  return PLAN_TIERS.FREE;
}
