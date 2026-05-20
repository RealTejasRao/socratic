"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import {
  CreditCard,
  Gift,
  LoaderCircle,
  MoveUpRight,
  ChevronRight,
} from "lucide-react";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { ROUTES } from "@/src/lib/routes";
import { cn } from "@/src/lib/utils";

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const sectionVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.06,
      staggerChildren: 0.08,
    },
  },
};

const heroTextVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    filter: "blur(10px)",
  },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.78,
      ease: SMOOTH_EASE,
    },
  },
};

const panelVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.988,
    filter: "blur(8px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.86,
      ease: SMOOTH_EASE,
    },
  },
};

const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 14,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.62,
      ease: SMOOTH_EASE,
    },
  },
};

type BillingExperienceProps = {
  interClassName: string;
  instrumentSerifClassName: string;
  isPremium: boolean;
  planTier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";
  planStatus: string;
  subscriptionCurrentPeriodEndIso: string | null;
  subscriptionCancelAtPeriodEnd: boolean;
  welcomeRequested: boolean;
};

function formatDate(dateIso: string | null) {
  if (!dateIso) {
    return "Not available";
  }

  return new Date(dateIso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function resolvePlanLabel(planTier: BillingExperienceProps["planTier"]) {
  if (planTier === "PREMIUM_ANNUAL") {
    return "Socratic + Annual";
  }
  if (planTier === "PREMIUM_MONTHLY") {
    return "Socratic + Monthly";
  }
  return "Free";
}

export function SocraticPlusBillingExperience({
  interClassName,
  instrumentSerifClassName,
  isPremium,
  planTier,
  planStatus,
  subscriptionCurrentPeriodEndIso,
  subscriptionCancelAtPeriodEnd,
  welcomeRequested,
}: BillingExperienceProps) {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");
  const shouldReduceMotion = useReducedMotion();
  const renewalDateLabel = formatDate(subscriptionCurrentPeriodEndIso);

  useEffect(() => {
    if (!welcomeRequested || !isPremium) {
      return;
    }
    window.history.replaceState(null, "", ROUTES.APP_BILLING);
  }, [isPremium, welcomeRequested]);

  async function openPortal() {
    setPortalError("");
    setIsPortalLoading(true);
    try {
      const response = await fetch("/api/v1/billing/portal", { method: "POST" });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const payload = (await response.json()) as { portalUrl?: string };
      if (!payload.portalUrl) {
        throw new Error("No portal URL returned.");
      }
      window.location.href = payload.portalUrl;
    } catch (error) {
      setPortalError(
        error instanceof Error ? error.message : "Could not open billing portal.",
      );
      setIsPortalLoading(false);
    }
  }

  return (
    <motion.section
      className="relative z-20 px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-20"
      variants={sectionVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="show"
    >
      <div className="mx-auto w-full max-w-5xl">
        <motion.h1
          className={cn(
            instrumentSerifClassName,
            "flex flex-wrap items-center justify-center gap-2 text-center text-[clamp(2.2rem,5.1vw,3.6rem)] leading-[0.98] tracking-[-0.024em] text-[#211f1d]",
          )}
          variants={heroTextVariants}
        >
          <motion.span variants={itemVariants}>Welcome to</motion.span>
          <motion.span
            className="inline-flex items-center gap-2 text-[#b8860b]"
            variants={itemVariants}
          >
            <span>Socratic Plus</span>
            <PremiumCrownIcon className="h-[0.88em] w-[0.88em]" />
          </motion.span>
        </motion.h1>
        <motion.p
          className={`${interClassName} mt-3 text-center text-[0.97rem] text-[#6f6b64]`}
          variants={heroTextVariants}
        >
          Manage your Socratic+ subscription, renewal, and billing details.
        </motion.p>

        <motion.div
          className="mt-6 overflow-hidden rounded-2xl border border-[#e7e4df] bg-white shadow-[0_8px_26px_rgba(22,20,18,0.07)]"
          variants={panelVariants}
        >
          <div className="grid gap-4 border-b border-[#ece9e4] px-5 py-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#ece9e4] sm:px-6">
            <motion.div className="sm:pr-6" variants={itemVariants}>
              <p className={`${interClassName} text-[0.75rem] text-[#7a7670]`}>Status</p>
              <span
                className={`${interClassName} mt-2 inline-flex rounded-md bg-[#e5f4e9] px-2.5 py-1 text-[0.75rem] font-medium text-[#2f8e48]`}
              >
                {isPremium ? "Active" : "Free"}
              </span>
            </motion.div>
            <motion.div className="sm:px-6" variants={itemVariants}>
              <p className={`${interClassName} text-[0.75rem] text-[#7a7670]`}>Plan</p>
              <p className={`${interClassName} mt-2 text-[1.06rem] font-medium text-[#292723]`}>
                {resolvePlanLabel(planTier)}
              </p>
            </motion.div>
            <motion.div className="sm:pl-6" variants={itemVariants}>
              <p className={`${interClassName} text-[0.75rem] text-[#7a7670]`}>Renews on</p>
              <p className={`${interClassName} mt-2 text-[1.06rem] font-medium text-[#292723]`}>
                {isPremium ? renewalDateLabel : "Not applicable"}
              </p>
            </motion.div>
          </div>

          <div className="divide-y divide-[#ece9e4]">
            <motion.div variants={itemVariants}>
              <button
                type="button"
                onClick={() => void openPortal()}
                disabled={!isPremium || isPortalLoading}
                className="group flex w-full cursor-pointer items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[#faf9f7] disabled:cursor-not-allowed disabled:opacity-60 sm:px-6"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e7e3dc] bg-[#f6f4f0] text-[#4f4a43]">
                  {isPortalLoading ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <CreditCard size={16} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`${interClassName} block text-[0.94rem] font-medium text-[#23211e]`}>
                    {isPortalLoading ? "Opening billing portal..." : "Manage Subscription"}
                  </span>
                  <span className={`${interClassName} mt-0.5 block text-[0.82rem] text-[#7b7670]`}>
                    Update payment method, billing details, or cancel.
                  </span>
                </span>
                <ChevronRight size={17} className="text-[#8a847c] transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link
                href={ROUTES.PRICING}
                className="group flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-[#faf9f7] sm:px-6"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e7e3dc] bg-[#f6f4f0] text-[#4f4a43]">
                  <Gift size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`${interClassName} block text-[0.94rem] font-medium text-[#23211e]`}>
                    Explore Perks
                  </span>
                  <span className={`${interClassName} mt-0.5 block text-[0.82rem] text-[#7b7670]`}>
                    See what's included in your plan.
                  </span>
                </span>
                <ChevronRight size={17} className="text-[#8a847c] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Link
                href={ROUTES.APP}
                className="group flex w-full items-center gap-4 px-5 py-4 transition-colors hover:bg-[#faf9f7] sm:px-6"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#e7e3dc] bg-[#f6f4f0] text-[#4f4a43]">
                  <MoveUpRight size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`${interClassName} block text-[0.94rem] font-medium text-[#23211e]`}>
                    Go to App
                  </span>
                  <span className={`${interClassName} mt-0.5 block text-[0.82rem] text-[#7b7670]`}>
                    Return to your workspace and chats.
                  </span>
                </span>
                <ChevronRight size={17} className="text-[#8a847c] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          className={`${interClassName} mt-3 text-[0.82rem] text-[#7b7670]`}
          variants={itemVariants}
        >
          Billing status: {planStatus}
          {isPremium && subscriptionCancelAtPeriodEnd
            ? " • Cancellation queued at period end."
            : ""}
        </motion.p>

        {portalError ? (
          <motion.p
            className={`${interClassName} mt-2 text-[0.82rem] text-[#b54747]`}
            variants={itemVariants}
          >
            {portalError}
          </motion.p>
        ) : null}
      </div>
    </motion.section>
  );
}
