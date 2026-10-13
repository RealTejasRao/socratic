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
import { AMBASSADOR_SUPPORT_DISCOUNT, PLAN_LIMITS } from "@/src/lib/billing";
import { ROUTES } from "@/src/lib/routes";
import type { PricingCopy } from "@/src/i18n/pricing";

type Props = {
  isSignedIn: boolean;
  currentPlanTier: "FREE" | "PREMIUM_MONTHLY" | "PREMIUM_ANNUAL";
  hasAmbassadorSupport: boolean;
  copy: PricingCopy;
};

type CheckoutPlan = "monthly" | "annual";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
});

function applyDiscount(price: number) {
  const discountMultiplier = 1 - AMBASSADOR_SUPPORT_DISCOUNT.percent / 100;
  return (price * discountMultiplier).toFixed(2);
}

export default function PricingCards({
  isSignedIn,
  currentPlanTier,
  hasAmbassadorSupport,
  copy,
}: Props) {
  const [loadingPlan, setLoadingPlan] = useState<CheckoutPlan | null>(null);
  const [error, setError] = useState("");

  const pricingPlans = useMemo(() => {
    const basicButtonText = !isSignedIn
      ? copy.buttons.signInToContinue
      : currentPlanTier === "FREE"
        ? copy.buttons.currentPlan
        : copy.buttons.useBasic;

    const premiumButtonText = !isSignedIn
      ? copy.buttons.signInToUpgrade
      : currentPlanTier === "FREE"
        ? copy.buttons.startPremium
        : copy.buttons.manageSubscription;
    const formatCount = (value: string, count: number) =>
      value.replace("{count}", String(count));
    const premiumMonthlyPrice = hasAmbassadorSupport ? applyDiscount(9) : "9";
    const premiumYearlyPrice = hasAmbassadorSupport ? applyDiscount(84) : "84";

    return [
      {
        id: BILLINGSDK_PLAN_IDS.FREE,
        title: copy.plans.basic.title,
        description: copy.plans.basic.description,
        currency: "$",
        monthlyPrice: "0",
        yearlyPrice: "0",
        buttonText: basicButtonText,
        features: [
          {
            name: formatCount(
              copy.plans.basic.features.dailyMessages,
              PLAN_LIMITS.FREE_DAILY_MESSAGES,
            ),
            icon: "check",
          },
          { name: copy.plans.basic.features.socraticMode, icon: "check" },
          { name: copy.plans.basic.features.roleplayMode, icon: "check" },
          {
            name: formatCount(
              copy.plans.basic.features.imageUploads,
              PLAN_LIMITS.FREE_DAILY_IMAGE_UPLOADS,
            ),
            icon: "check",
          },
          { name: copy.plans.basic.features.debateMode, icon: "minus" },
          { name: copy.plans.basic.features.detailedDebateFeedback, icon: "minus" },
          { name: copy.plans.basic.features.ruthlessTone, icon: "minus" },
          { name: copy.plans.basic.features.globalMemory, icon: "minus" },
          { name: copy.plans.basic.features.longerHistory, icon: "minus" },
          { name: copy.plans.basic.features.newFeatureAccess, icon: "minus" },
          { name: copy.plans.basic.features.unlimitedImageUploads, icon: "minus" },
        ],
      },
      {
        id: BILLINGSDK_PLAN_IDS.PREMIUM_MONTHLY,
        title: copy.plans.premium.title,
        description: copy.plans.premium.description,
        currency: "$",
        monthlyPrice: premiumMonthlyPrice,
        yearlyPrice: premiumYearlyPrice,
        buttonText: premiumButtonText,
        highlight: true,
        badge: hasAmbassadorSupport
          ? `${AMBASSADOR_SUPPORT_DISCOUNT.percent}% off`
          : copy.plans.premium.badge,
        features: [
          { name: copy.plans.premium.features.everythingBasic, icon: "check" },
          { name: copy.plans.premium.features.unlimitedMessages, icon: "check" },
          { name: copy.plans.premium.features.socraticMode, icon: "check" },
          { name: copy.plans.premium.features.roleplayMode, icon: "check" },
          { name: copy.plans.premium.features.unlimitedImageUploads, icon: "check" },
          { name: copy.plans.premium.features.debateMode, icon: "check" },
          { name: copy.plans.premium.features.detailedDebateFeedback, icon: "check" },
          { name: copy.plans.premium.features.ruthlessTone, icon: "check" },
          { name: copy.plans.premium.features.globalMemory, icon: "check" },
          { name: copy.plans.premium.features.longerHistory, icon: "check" },
          { name: copy.plans.premium.features.newFeatureAccess, icon: "check" },
        ],
      },
    ] satisfies Plan[];
  }, [copy, currentPlanTier, hasAmbassadorSupport, isSignedIn]);

  async function openPortal() {
    setError("");
    setLoadingPlan(null);
    const response = await fetch("/api/v1/billing/portal", { method: "POST" });
    if (!response.ok) {
      setError(copy.status.customerPortalError);
      return;
    }

    const payload = (await response.json()) as { portalUrl?: string };
    if (!payload.portalUrl) {
      setError(copy.status.portalUrlMissing);
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
        setError(reason || copy.status.checkoutError);
        return;
      }

      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) {
        setError(copy.status.checkoutUrlMissing);
        return;
      }
      window.location.href = payload.checkoutUrl;
    } catch {
      setError(copy.status.checkoutError);
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
      window.location.href = ROUTES.APP_ROLEPLAY;
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
              {copy.hero.titlePrefix}{" "}
              <span className="pwa-mobile-standalone-next-line inline-flex items-center gap-[0.18em] leading-none text-[#b8860b]">
                <span>{copy.hero.titleProduct}</span>
                <PremiumCrownIcon className="h-[0.8em] w-[0.8em] shrink-0 translate-y-[0.06em]" />
              </span>
            </span>
          }
          description={copy.hero.description}
          subtitle={copy.hero.subtitle}
          onPlanSelect={handlePlanSelect}
          size="medium"
          theme="classic"
          className="w-full py-0"
          showBillingToggle={true}
          billingToggleLabels={{
            monthly: copy.billing.monthly,
            yearly: copy.billing.yearly,
          }}
          priceLabels={{
            save: copy.billing.save,
            perYear: copy.billing.perYear,
            perMonth: copy.billing.perMonth,
            percentOff: copy.billing.percentOff,
            premiumPrice: copy.billing.premiumPrice,
          }}
        />
      </div>

      {isLoading ? (
        <p className="hero-load-up hero-load-up-hero-copy mx-auto mt-4 inline-flex items-center gap-2 text-[13px] text-black/60">
          <LoaderCircle size={14} className="animate-spin" />
          {copy.status.openingCheckout}
        </p>
      ) : null}

      {isPremium ? (
        <div className="hero-load-up hero-load-up-hero-cta mx-auto mt-5 flex w-full max-w-365 items-center gap-3">
          <button
            type="button"
            onClick={() => void openPortal()}
            className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] text-black transition hover:bg-[#f4f4f3]"
          >
            {copy.buttons.manageSubscription}
          </button>
          <Link
            href={ROUTES.APP_BILLING}
            className="inline-flex rounded-full border border-black/15 bg-white px-4 py-2 text-[13px] text-black transition hover:bg-[#f4f4f3]"
          >
            {copy.buttons.openBillingDashboard}
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
