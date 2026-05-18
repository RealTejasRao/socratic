import type { PlanTier } from "@prisma/client";
import { PLAN_LIMITS } from "./billing";

export interface Plan {
  id: string;
  title: string;
  description: string;
  highlight?: boolean;
  type?: "monthly" | "yearly";
  currency?: string;
  monthlyPrice: string;
  yearlyPrice: string;
  buttonText: string;
  badge?: string;
  features: {
    name: string;
    icon: string;
    iconColor?: string;
  }[];
}

export interface CurrentPlan {
  plan: Plan;
  type: "monthly" | "yearly" | "custom";
  price?: string;
  nextBillingDate: string;
  paymentMethod: string;
  status: "active" | "inactive" | "past_due" | "cancelled";
}

export const BILLINGSDK_PLAN_IDS = {
  FREE: "free",
  PREMIUM_MONTHLY: "premium_monthly",
  PREMIUM_ANNUAL: "premium_annual",
} as const;

export const socraticPlans: Plan[] = [
  {
    id: BILLINGSDK_PLAN_IDS.FREE,
    title: "Free",
    description: "Core Socratic chat and reflection.",
    currency: "$",
    monthlyPrice: "0",
    yearlyPrice: "0",
    buttonText: "Keep Free",
    features: [
      {
        name: `${PLAN_LIMITS.FREE_DAILY_MESSAGES} messages/day`,
        icon: "check",
      },
      { name: "Standard conversations", icon: "check" },
      { name: "Shorter history", icon: "check" },
      { name: "Roleplay mode", icon: "check" },
    ],
  },
  {
    id: BILLINGSDK_PLAN_IDS.PREMIUM_MONTHLY,
    title: "Socratic+ Monthly",
    description: "Full premium access paid monthly.",
    currency: "$",
    monthlyPrice: "9",
    yearlyPrice: "108",
    buttonText: "Start Monthly",
    features: [
      { name: "Unlimited messages", icon: "check" },
      { name: "Debate mode access", icon: "check" },
      { name: "Detailed debate feedback", icon: "check" },
      { name: "Ruthless / blunt tone", icon: "check" },
      { name: "Global memory", icon: "check" },
      { name: "Early access features", icon: "check" },
    ],
  },
  {
    id: BILLINGSDK_PLAN_IDS.PREMIUM_ANNUAL,
    title: "Socratic+ Annual",
    description: "$7/month billed annually.",
    currency: "$",
    monthlyPrice: "7",
    yearlyPrice: "84",
    buttonText: "Start Annual",
    badge: "Recommended",
    highlight: true,
    features: [
      { name: "Unlimited messages", icon: "check" },
      { name: "Debate mode access", icon: "check" },
      { name: "Detailed debate feedback", icon: "check" },
      { name: "Ruthless / blunt tone", icon: "check" },
      { name: "Global memory", icon: "check" },
      { name: "Early access features", icon: "check" },
    ],
  },
];

export const plans = socraticPlans;

export function getBillingSdkPlanById(planId: string) {
  return socraticPlans.find((plan) => plan.id === planId) ?? socraticPlans[0]!;
}

export function getBillingSdkPlanByTier(planTier: PlanTier) {
  if (planTier === "PREMIUM_ANNUAL") {
    return getBillingSdkPlanById(BILLINGSDK_PLAN_IDS.PREMIUM_ANNUAL);
  }
  if (planTier === "PREMIUM_MONTHLY") {
    return getBillingSdkPlanById(BILLINGSDK_PLAN_IDS.PREMIUM_MONTHLY);
  }
  return getBillingSdkPlanById(BILLINGSDK_PLAN_IDS.FREE);
}
