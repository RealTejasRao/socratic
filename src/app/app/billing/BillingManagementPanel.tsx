"use client";

import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SubscriptionManagement } from "@/src/components/billingsdk/subscription-management";
import {
  BILLINGSDK_PLAN_IDS,
  getBillingSdkPlanByTier,
} from "@/src/lib/billingsdk-config";
import type { PlanTier, BillingSubscriptionStatus } from "@prisma/client";
import type { CurrentPlan } from "@/src/lib/billingsdk-config";
import { useAppRoute } from "../components/app-route-context";
import { getLocalizedBillingPlans } from "@/src/i18n/app-config";

type Props = {
  planTier: PlanTier;
  planStatus: BillingSubscriptionStatus;
  subscriptionCurrentPeriodEnd: string | null;
};

function mapStatus(status: BillingSubscriptionStatus) {
  if (status === "ACTIVE") {
    return "active" as const;
  }
  if (status === "FAILED" || status === "ON_HOLD") {
    return "past_due" as const;
  }
  if (status === "CANCELLED" || status === "EXPIRED") {
    return "cancelled" as const;
  }
  return "inactive" as const;
}

export default function BillingManagementPanel({
  planTier,
  planStatus,
  subscriptionCurrentPeriodEnd,
}: Props) {
  const { copy, locale } = useAppRoute();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const localizedPlans = useMemo(() => getLocalizedBillingPlans(copy), [copy]);
  const originalPlan = getBillingSdkPlanByTier(planTier);
  const currentPlan = localizedPlans.find((plan) => plan.id === originalPlan.id) ?? originalPlan;
  const canManageSubscription = planTier !== "FREE";

  const currentPlanModel = useMemo<CurrentPlan>(() => {
    const cycleType =
      planTier === "PREMIUM_ANNUAL"
        ? "yearly"
        : planTier === "PREMIUM_MONTHLY"
          ? "monthly"
          : "custom";
    const base: CurrentPlan = {
      plan: currentPlan,
      type: cycleType,
      nextBillingDate: subscriptionCurrentPeriodEnd
        ? new Date(subscriptionCurrentPeriodEnd).toLocaleDateString(locale)
        : copy.billing.notAvailable,
      paymentMethod: copy.billing.managedInDodo,
      status: mapStatus(planStatus),
    };

    if (cycleType === "custom") {
      return {
        ...base,
        price: "$0",
      };
    }

    return base;
  }, [copy.billing.managedInDodo, copy.billing.notAvailable, currentPlan, planStatus, planTier, subscriptionCurrentPeriodEnd, locale]);

  async function openPortal() {
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/billing/portal", { method: "POST" });
      if (!response.ok) {
        throw new Error(copy.billing.portalCustomerFailed);
      }
      const payload = (await response.json()) as { portalUrl?: string };
      if (!payload.portalUrl) {
        throw new Error(copy.billing.portalUrlMissing);
      }
      window.location.href = payload.portalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.billing.portalError);
      setIsBusy(false);
    }
  }

  async function startCheckout(target: "monthly" | "annual") {
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: target }),
      });
      if (!response.ok) {
        throw new Error(locale === "ru" || locale === "ar" ? copy.billing.checkoutError : await response.text());
      }
      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) {
        throw new Error(copy.billing.checkoutUrlMissing);
      }
      window.location.href = payload.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.billing.checkoutError);
      setIsBusy(false);
    }
  }

  async function handlePlanChange(planId: string) {
    if (planId === BILLINGSDK_PLAN_IDS.PREMIUM_MONTHLY) {
      await startCheckout("monthly");
      return;
    }
    if (planId === BILLINGSDK_PLAN_IDS.PREMIUM_ANNUAL) {
      await startCheckout("annual");
      return;
    }
    await openPortal();
  }

  return (
    <div className="space-y-3">
      {canManageSubscription ? (
        <SubscriptionManagement
          labels={copy.billingUi.subscription}
          className="border-[#d8c9ad] bg-[#f9f4e8] text-[#211b14]"
          currentPlan={currentPlanModel}
          updatePlan={{
            locale,
            currentPlan,
            plans: localizedPlans,
            labels: copy.billingUi.update,
            onPlanChange: (planId) => {
              void handlePlanChange(planId);
            },
            triggerText: copy.billing.changePlan,
            title: copy.billing.switchPlan,
          }}
          cancelSubscription={{
            locale,
            labels: copy.billingUi.cancel,
            triggerButtonText: copy.billingUi.cancel.trigger,
            keepButtonText: copy.billingUi.cancel.keep,
            finalTitle: copy.billingUi.cancel.finalTitle,
            finalSubtitle: copy.billingUi.cancel.finalSubtitle,
            finalWarningText: copy.billingUi.cancel.finalWarning,
            goBackButtonText: copy.billingUi.cancel.goBack,
            title: copy.billing.cancelManage,
            description: copy.billing.cancelDescription,
            plan: currentPlan,
            warningTitle: copy.billing.warningTitle,
            warningText: copy.billing.warningText,
            continueButtonText: copy.billing.continueToPortal,
            confirmButtonText: copy.billing.openDodoPortal,
            onCancel: async () => {
              await openPortal();
            },
            onKeepSubscription: async () => undefined,
          }}
        />
      ) : (
        <div className="rounded-2xl border border-[#d8c9ad] bg-[#f9f4e8] px-4 py-4">
          <p className="text-[12px] text-[#6f6250]">
            {copy.billing.noPremium}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startCheckout("monthly")}
              className="rounded-full border border-[#c9b79a] bg-[#efe5d2] px-3 py-1.5 text-[12px] text-[#3d3224] transition hover:bg-[#e8dbc3]"
            >
              {copy.billing.startMonthly}
            </button>
            <button
              type="button"
              onClick={() => void startCheckout("annual")}
              className="rounded-full border border-[#cab287] bg-[#f0d9af] px-3 py-1.5 text-[12px] text-[#342516] transition hover:bg-[#e7cb98]"
            >
              {copy.billing.startAnnual}
            </button>
          </div>
        </div>
      )}

      {isBusy ? (
        <p className="inline-flex items-center gap-2 text-[12px] text-[#6f6250]">
          <LoaderCircle size={13} className="animate-spin" />
          {copy.billing.redirecting}
        </p>
      ) : null}

      {error ? <p className="text-[12px] text-rose-700">{error}</p> : null}
    </div>
  );
}
