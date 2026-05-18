import "server-only";
import { BillingSubscriptionStatus, PlanTier, Prisma } from "@prisma/client";
import type { DodoPayments } from "dodopayments";
import { prisma } from "src/server/db/client";
import {
  BILLING_SUBSCRIPTION_STATUSES,
  PLAN_TIERS,
  resolvePlanTierFromProductId,
} from "src/lib/billing";

type SubscriptionPayload = DodoPayments.Subscription;

type ResolvedUserInput = {
  customerId: string;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
};

function mapDodoStatusToBillingStatus(status: string): BillingSubscriptionStatus {
  switch (status) {
    case "active":
      return BILLING_SUBSCRIPTION_STATUSES.ACTIVE;
    case "pending":
      return BILLING_SUBSCRIPTION_STATUSES.PENDING;
    case "on_hold":
      return BILLING_SUBSCRIPTION_STATUSES.ON_HOLD;
    case "cancelled":
      return BILLING_SUBSCRIPTION_STATUSES.CANCELLED;
    case "failed":
      return BILLING_SUBSCRIPTION_STATUSES.FAILED;
    case "expired":
      return BILLING_SUBSCRIPTION_STATUSES.EXPIRED;
    default:
      return BILLING_SUBSCRIPTION_STATUSES.INACTIVE;
  }
}

function toNullableDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseSubscriptionInterval(
  count: number,
  interval: "Day" | "Week" | "Month" | "Year",
) {
  return `${count}_${interval.toLowerCase()}`;
}

function toPlanTier(productId: string): PlanTier {
  const tier = resolvePlanTierFromProductId(productId);
  if (
    tier === PLAN_TIERS.PREMIUM_MONTHLY ||
    tier === PLAN_TIERS.PREMIUM_ANNUAL
  ) {
    return tier;
  }

  return PLAN_TIERS.FREE;
}

async function resolveUserForCustomer(input: ResolvedUserInput) {
  const byCustomerId = await prisma.user.findUnique({
    where: { dodoCustomerId: input.customerId },
    select: { id: true, dodoCustomerId: true },
  });

  if (byCustomerId) {
    return byCustomerId;
  }

  const metadataUserId =
    typeof input.metadata?.["appUserId"] === "string"
      ? input.metadata["appUserId"]
      : null;
  if (metadataUserId) {
    const byUserId = await prisma.user.findUnique({
      where: { id: metadataUserId },
      select: { id: true, dodoCustomerId: true },
    });
    if (byUserId) {
      return byUserId;
    }
  }

  const metadataClerkUserId =
    typeof input.metadata?.["clerkUserId"] === "string"
      ? input.metadata["clerkUserId"]
      : null;
  if (metadataClerkUserId) {
    const byClerkUserId = await prisma.user.findUnique({
      where: { clerkUserId: metadataClerkUserId },
      select: { id: true, dodoCustomerId: true },
    });
    if (byClerkUserId) {
      return byClerkUserId;
    }
  }

  const normalizedEmail = input.email?.trim().toLowerCase();
  if (normalizedEmail) {
    const byEmail = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, dodoCustomerId: true },
    });
    if (byEmail) {
      return byEmail;
    }
  }

  return null;
}

async function syncUserPlanFromSubscriptions(tx: Prisma.TransactionClient, userId: string) {
  const latestActivePremium = await tx.billingSubscription.findFirst({
    where: {
      userId,
      status: BILLING_SUBSCRIPTION_STATUSES.ACTIVE,
      planTier: {
        in: [PLAN_TIERS.PREMIUM_MONTHLY, PLAN_TIERS.PREMIUM_ANNUAL],
      },
    },
    orderBy: [{ currentPeriodEnd: "desc" }, { updatedAt: "desc" }],
  });

  if (latestActivePremium) {
    await tx.user.update({
      where: { id: userId },
      data: {
        planTier: latestActivePremium.planTier,
        planStatus: BILLING_SUBSCRIPTION_STATUSES.ACTIVE,
        activeSubscriptionId: latestActivePremium.dodoSubscriptionId,
        subscriptionCurrentPeriodEnd: latestActivePremium.currentPeriodEnd,
        subscriptionCancelAtPeriodEnd: latestActivePremium.cancelAtPeriodEnd,
        subscriptionUpdatedAt: new Date(),
      },
    });
    return;
  }

  const latestAny = await tx.billingSubscription.findFirst({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
  });

  if (!latestAny) {
    await tx.user.update({
      where: { id: userId },
      data: {
        planTier: PLAN_TIERS.FREE,
        planStatus: BILLING_SUBSCRIPTION_STATUSES.INACTIVE,
        activeSubscriptionId: null,
        subscriptionCurrentPeriodEnd: null,
        subscriptionCancelAtPeriodEnd: false,
        subscriptionUpdatedAt: new Date(),
      },
    });
    return;
  }

  await tx.user.update({
    where: { id: userId },
    data: {
      planTier: PLAN_TIERS.FREE,
      planStatus: latestAny.status,
      activeSubscriptionId: latestAny.dodoSubscriptionId,
      subscriptionCurrentPeriodEnd: latestAny.currentPeriodEnd,
      subscriptionCancelAtPeriodEnd: latestAny.cancelAtPeriodEnd,
      subscriptionUpdatedAt: new Date(),
    },
  });
}

export async function syncSubscriptionFromPayload(payload: SubscriptionPayload) {
  const resolvedUser = await resolveUserForCustomer({
    customerId: payload.customer.customer_id,
    email: payload.customer.email,
    ...(payload.customer.metadata
      ? { metadata: payload.customer.metadata as Record<string, unknown> }
      : {}),
  });

  if (!resolvedUser) {
    return null;
  }

  const planTier = toPlanTier(payload.product_id);
  const status = mapDodoStatusToBillingStatus(payload.status);
  const currentPeriodStart = toNullableDate(payload.previous_billing_date);
  const currentPeriodEnd = toNullableDate(payload.next_billing_date);
  const cancelledAt = toNullableDate(payload.cancelled_at ?? null);
  const expiresAt = toNullableDate(payload.expires_at ?? null);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: resolvedUser.id },
      data: {
        dodoCustomerId: payload.customer.customer_id,
      },
    });

    await tx.billingSubscription.upsert({
      where: { dodoSubscriptionId: payload.subscription_id },
      create: {
        userId: resolvedUser.id,
        dodoSubscriptionId: payload.subscription_id,
        dodoCustomerId: payload.customer.customer_id,
        productId: payload.product_id,
        status,
        planTier,
        currency: payload.currency,
        recurringAmount: payload.recurring_pre_tax_amount,
        billingInterval: parseSubscriptionInterval(
          payload.subscription_period_count,
          payload.subscription_period_interval,
        ),
        cancelAtPeriodEnd: payload.cancel_at_next_billing_date,
        currentPeriodStart,
        currentPeriodEnd,
        cancelledAt,
        expiresAt,
        rawPayload: payload as unknown as Prisma.InputJsonValue,
      },
      update: {
        dodoCustomerId: payload.customer.customer_id,
        productId: payload.product_id,
        status,
        planTier,
        currency: payload.currency,
        recurringAmount: payload.recurring_pre_tax_amount,
        billingInterval: parseSubscriptionInterval(
          payload.subscription_period_count,
          payload.subscription_period_interval,
        ),
        cancelAtPeriodEnd: payload.cancel_at_next_billing_date,
        currentPeriodStart,
        currentPeriodEnd,
        cancelledAt,
        expiresAt,
        rawPayload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    await syncUserPlanFromSubscriptions(tx, resolvedUser.id);
  });

  return { userId: resolvedUser.id };
}
