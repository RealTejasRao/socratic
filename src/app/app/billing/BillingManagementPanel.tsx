"use client";

import { useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { SubscriptionManagement } from "@/src/components/billingsdk/subscription-management";
import {
  BILLINGSDK_PLAN_IDS,
  getBillingSdkPlanByTier,
  socraticPlans,
} from "@/src/lib/billingsdk-config";
import type { PlanTier, BillingSubscriptionStatus } from "@prisma/client";
import type { CurrentPlan } from "@/src/lib/billingsdk-config";

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
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const currentPlan = getBillingSdkPlanByTier(planTier);
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
        ? new Date(subscriptionCurrentPeriodEnd).toLocaleDateString()
        : "N/A",
      paymentMethod: "Managed in Dodo Payments",
      status: mapStatus(planStatus),
    };

    if (cycleType === "custom") {
      return {
        ...base,
        price: "$0",
      };
    }

    return base;
  }, [currentPlan, planStatus, planTier, subscriptionCurrentPeriodEnd]);

  async function openPortal() {
    setIsBusy(true);
    setError("");
    try {
      const response = await fetch("/api/v1/billing/portal", { method: "POST" });
      if (!response.ok) {
        throw new Error("Could not open customer portal");
      }
      const payload = (await response.json()) as { portalUrl?: string };
      if (!payload.portalUrl) {
        throw new Error("No portal URL returned");
      }
      window.location.href = payload.portalUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Portal error");
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
        throw new Error(await response.text());
      }
      const payload = (await response.json()) as { checkoutUrl?: string };
      if (!payload.checkoutUrl) {
        throw new Error("No checkout URL returned");
      }
      window.location.href = payload.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout error");
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
          className="border-[#d8c9ad] bg-[#f9f4e8] text-[#211b14]"
          currentPlan={currentPlanModel}
          updatePlan={{
            currentPlan,
            plans: socraticPlans,
            onPlanChange: (planId) => {
              void handlePlanChange(planId);
            },
            triggerText: "Change Plan",
            title: "Switch your Socratic+ plan",
          }}
          cancelSubscription={{
            title: "Cancel or manage subscription",
            description:
              "For subscription cancellation and payment-method updates, continue in the secure Dodo customer portal.",
            plan: currentPlan,
            warningTitle: "You can still keep using the free tier.",
            warningText:
              "If you cancel, premium features remain active until the end of the paid period.",
            continueButtonText: "Continue to portal",
            confirmButtonText: "Open Dodo portal",
            onCancel: async () => {
              await openPortal();
            },
            onKeepSubscription: async () => undefined,
          }}
        />
      ) : (
        <div className="rounded-2xl border border-[#d8c9ad] bg-[#f9f4e8] px-4 py-4">
          <p className="text-[12px] text-[#6f6250]">
            No active premium subscription yet. Upgrade to Socratic+ to unlock
            unlimited messages, debate mode, and global memory.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startCheckout("monthly")}
              className="rounded-full border border-[#c9b79a] bg-[#efe5d2] px-3 py-1.5 text-[12px] text-[#3d3224] transition hover:bg-[#e8dbc3]"
            >
              Start monthly
            </button>
            <button
              type="button"
              onClick={() => void startCheckout("annual")}
              className="rounded-full border border-[#cab287] bg-[#f0d9af] px-3 py-1.5 text-[12px] text-[#342516] transition hover:bg-[#e7cb98]"
            >
              Start annual
            </button>
          </div>
        </div>
      )}

      {isBusy ? (
        <p className="inline-flex items-center gap-2 text-[12px] text-[#6f6250]">
          <LoaderCircle size={13} className="animate-spin" />
          Redirecting to Dodo Payments...
        </p>
      ) : null}

      {error ? <p className="text-[12px] text-rose-700">{error}</p> : null}
    </div>
  );
}
