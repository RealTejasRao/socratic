"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Instrument_Serif } from "next/font/google";
import { LoaderCircle } from "lucide-react";
import { PremiumCrownIcon } from "@/src/components/billingsdk/premium-crown-icon";
import { PricingTableFour } from "@/src/components/billingsdk/pricing-table-four";
import {
  BILLINGSDK_PLAN_IDS,
  type Plan,
} from "@/src/lib/billingsdk-config";
import { PLAN_LIMITS } from "@/src/lib/billing";
import { ROUTES } from "@/src/lib/routes";

type Props = {
  isSignedIn: boolean;
  currentPlanTier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";
};

type CheckoutPlan = "monthly" | "annual";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

export default function PricingCards({ isSignedIn, currentPlanTier }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState("");

  const pricingPlans = useMemo(() => {
    const basicButtonText = !isSignedIn
      ? "Sign in to continue"
      : currentPlanTier === "FREE"
        ? "Current plan"
        : "Use Basic";

    const premiumButtonText = !isSignedIn
      ? "Sign in to upgrade"
      : currentPlanTier === "FREE"
        ? "Start Socratic +"
        : "Manage subscription";

    return [
      {
        id: BILLINGSDK_PLAN_IDS.FREE,
        title: "Basic",
        description:
          "A thoughtful space for everyday curiosity. Limited Access to features.",
        currency: "$",
        monthlyPrice: "0",
        yearlyPrice: "0",
        buttonText: basicButtonText,
        features: [
          {
            name: `${PLAN_LIMITS.FREE_DAILY_MESSAGES} messages per day`,
            icon: "check",
          },
          { name: "Socratic mode", icon: "check" },
          { name: "Roleplay mode", icon: "check" },
          {
            name: `${PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS} image uploads`,
            icon: "check",
          },
          { name: "Debate mode", icon: "minus" },
          { name: "Detailed Debate Feedback", icon: "minus" },
          { name: "Ruthless, blunt tone mode", icon: "minus" },
          { name: "Global Memory", icon: "minus" },
          { name: "Longer conversation history", icon: "minus" },
          { name: "New feature access", icon: "minus" },
          { name: "Unlimited image uploads", icon: "minus" },
        ],
      },
      {
        id: BILLINGSDK_PLAN_IDS.PREMIUM_MONTHLY,
        title: "Socratic Plus",
        description:
          "Built for deeper thinking without limits. Unlimited Access to all features.",
        currency: "$",
        monthlyPrice: "9",
        yearlyPrice: "84",
        buttonText: premiumButtonText,
        highlight: true,
        badge: "Most Popular",
        features: [
          { name: "Everything in Basic mode", icon: "check" },
          { name: "Unlimited messages", icon: "check" },
          { name: "Socratic mode", icon: "check" },
          { name: "Roleplay mode", icon: "check" },
          { name: "Unlimited image uploads", icon: "check" },
          { name: "Debate mode", icon: "check" },
          { name: "Detailed Debate Feedback", icon: "check" },
          { name: "Ruthless, blunt tone mode", icon: "check" },
          { name: "Global Memory", icon: "check" },
          { name: "Longer conversation history", icon: "check" },
          { name: "New feature access", icon: "check" },
        ],
      },
    ] satisfies Plan[];
  }, [currentPlanTier, isSignedIn]);

  async function openPortal() {
    setError("");
    setLoadingPlan(null);
    const response = await fetch("/api/v1/billing/portal", { method: "POST" });
    if (!response.ok) {
      setError("Could not open customer portal.");
      return;
    }

    const payload = (await response.json()) as { portalUrl?: string };
    if (!payload.portalUrl) {
      setError("No portal URL returned.");
      return;
    }
    window.location.href = payload.portalUrl;
  }

  async function startCheckout(plan: CheckoutPlan) {
    setError("");
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (!response.ok) {
        const reason = await response.text();
        setError(reason || "Could not start checkout.");
        return;
      }

      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) {
        setError("No checkout URL returned.");
        return;
      }
      window.location.href = payload.checkoutUrl;
    } catch {
      setError("Could not start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  function handlePlanSelect(planId: string, cycle: CheckoutPlan) {
    if (!isSignedIn) {
      window.location.href = ROUTES.SIGN_IN;
      return;
    }

    if (planId === BILLINGSDK_PLAN_IDS.FREE) {
      window.location.href = ROUTES.APP;
      return;
    }

    if (planId === BILLINGSDK_PLAN_IDS.PREMIUM_MONTHLY) {
      if (currentPlanTier !== "FREE") {
        void openPortal();
        return;
      }
      void startCheckout(cycle);
    }
  }

  const isLoading = loadingPlan !== null;
  const isPremium = currentPlanTier !== "FREE";

  return (
    <section className="relative z-20 px-4 pt-28 pb-16 sm:px-6 sm:pt-32 sm:pb-20">
      <div className="hero-load-up hero-load-up-image mx-auto w-full [--background:#ffffff] [--foreground:#171717] [--card:#ffffff] [--card-foreground:#171717] [--muted:#f5f5f5] [--muted-foreground:#5f6368] [--border:rgba(17,17,17,0.14)] [--primary:#111111] [--primary-foreground:#ffffff] [--secondary:#f1f1f1] [--secondary-foreground:#171717]">
        <PricingTableFour
          plans={pricingPlans}
          title={
            <span className={`${instrumentSerif.className} text-[clamp(2.8rem,6.4vw,4.6rem)] font-normal tracking-[-0.022em] text-[#1f1b1b]`}>
              Go Further With{" "}
              <span className="pwa-mobile-standalone-next-line text-[#b8860b]">
                Socratic Plus <PremiumCrownIcon className="ml-1" />
              </span>
            </span>
          }
          description="One plan for curiosity. One for actual thinkers!"
          subtitle="Transparent Pricing"
          onPlanSelect={handlePlanSelect}
          size="medium"
          theme="classic"
          className="w-full py-0"
          showBillingToggle={true}
          billingToggleLabels={{
            monthly: "Monthly",
            yearly: "Yearly",
          }}
        />
      </div>

      {isLoading ? (
        <p className="hero-load-up hero-load-up-hero-copy mx-auto mt-4 inline-flex items-center gap-2 text-[13px] text-black/60">
          <LoaderCircle size={14} className="animate-spin" />
          Opening secure checkout...
        </p>
      ) : null}

      {isPremium ? (
        <div className="hero-load-up hero-load-up-hero-cta mx-auto mt-5 flex w-full max-w-365 items-center gap-3">
          <button
            type="button"
            onClick={() => void openPortal()}
            className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] text-black transition hover:bg-[#f4f4f3]"
          >
            Manage subscription
          </button>
          <Link
            href={ROUTES.APP_BILLING}
            className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] text-black transition hover:bg-[#f4f4f3]"
          >
            Open billing dashboard
          </Link>
        </div>
      ) : null}

      {error ? (
        <p className="mx-auto mt-3 w-full max-w-365 text-[13px] text-[#b54747]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
