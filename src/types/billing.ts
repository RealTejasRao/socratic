export type PlanTier = "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";

export type BillingSubscriptionStatus =
  | "INACTIVE"
  | "PENDING"
  | "ACTIVE"
  | "ON_HOLD"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";

export type BillingStateResponse = {
  planTier: PlanTier;
  planStatus: BillingSubscriptionStatus;
  isPremium: boolean;
  tierLabel: "Free" | "Socratic+";
  dodoCustomerId: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  subscriptionCancelAtPeriodEnd: boolean;
  usage: {
    dailyMessageLimit: number;
    dailyMessagesUsed: number;
    dailyMessagesRemaining: number | null;
    dailyImageUploadLimit: number;
    dailyImageUploadsUsed: number;
    dailyImageUploadsRemaining: number | null;
    resetsAt: string | null;
  };
  features: {
    debateMode: boolean;
    detailedDebateFeedback: boolean;
    ruthlessTone: boolean;
    globalMemory: boolean;
    earlyAccess: boolean;
  };
};
