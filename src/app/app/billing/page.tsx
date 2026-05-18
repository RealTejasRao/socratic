import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ROUTES } from "src/lib/routes";
import { getUserBillingStateByClerkId, resolveUserTierLabel } from "src/server/billing/access";
import { SOCRATIC_PLUS_NAME } from "src/lib/billing";
import BillingPortalButton from "../components/BillingPortalButton";
import BillingManagementPanel from "./BillingManagementPanel";

export default async function BillingPage() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(ROUTES.SIGN_IN);
  }

  const billing = await getUserBillingStateByClerkId(clerkUserId);
  if (!billing) {
    redirect(ROUTES.HOME);
  }

  const tierLabel = resolveUserTierLabel(billing.planTier);

  return (
    <div className="mx-auto w-full max-w-160 px-4 py-8 md:px-8">
      <div className="rounded-3xl border border-[#d5cbb8] bg-[#f6f0e3] px-5 py-5 shadow-[0_16px_44px_rgba(29,23,16,0.12)]">
        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7d6f5a]">
          Billing
        </p>
        <h1 className="mt-3 text-[34px] leading-[1.04] tracking-[-0.04em] text-[#1f1a14] font-[Georgia,serif]">
          Account & Subscription
        </h1>
        <p className="mt-2 text-[14px] leading-7 text-[#6f6250]">
          Manage your {SOCRATIC_PLUS_NAME} subscription, renewal, and billing details.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#d6c9b4] bg-[#f9f4e9] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7e725e]">
              Current Plan
            </p>
            <p className="mt-1.5 text-[20px] text-[#211b14] font-[Georgia,serif]">
              {tierLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d6c9b4] bg-[#f9f4e9] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7e725e]">
              Subscription Status
            </p>
            <p className="mt-1.5 text-[20px] text-[#211b14] font-[Georgia,serif]">
              {billing.planStatus}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d6c9b4] bg-[#f9f4e9] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7e725e]">
              Renews / Expires
            </p>
            <p className="mt-1.5 text-[16px] text-[#211b14]">
              {billing.subscriptionCurrentPeriodEnd
                ? billing.subscriptionCurrentPeriodEnd.toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div className="rounded-2xl border border-[#d6c9b4] bg-[#f9f4e9] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#7e725e]">
              Cancel At Period End
            </p>
            <p className="mt-1.5 text-[16px] text-[#211b14]">
              {billing.subscriptionCancelAtPeriodEnd ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <BillingPortalButton />
          <a
            href={ROUTES.PRICING}
            className="inline-flex items-center rounded-full border border-[#cabda8] bg-[#efe5d2] px-4 py-2 text-[13px] text-[#504334] transition hover:bg-[#e8dcc7]"
          >
            View pricing
          </a>
        </div>

        <div className="mt-6">
          <BillingManagementPanel
            planTier={billing.planTier}
            planStatus={billing.planStatus}
            subscriptionCurrentPeriodEnd={
              billing.subscriptionCurrentPeriodEnd
                ? billing.subscriptionCurrentPeriodEnd.toISOString()
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}
