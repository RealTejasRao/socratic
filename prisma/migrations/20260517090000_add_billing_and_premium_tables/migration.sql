CREATE TYPE "PlanTier" AS ENUM ('FREE', 'PREMIUM_MONTHLY', 'PREMIUM_ANNUAL');
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('INACTIVE', 'PENDING', 'ACTIVE', 'ON_HOLD', 'CANCELLED', 'FAILED', 'EXPIRED');

ALTER TABLE "User"
ADD COLUMN "dodoCustomerId" VARCHAR(80),
ADD COLUMN "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN "planStatus" "BillingSubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN "activeSubscriptionId" VARCHAR(80),
ADD COLUMN "subscriptionCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "subscriptionUpdatedAt" TIMESTAMP(3);

CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dodoSubscriptionId" VARCHAR(80) NOT NULL,
    "dodoCustomerId" VARCHAR(80) NOT NULL,
    "productId" VARCHAR(80) NOT NULL,
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "planTier" "PlanTier" NOT NULL DEFAULT 'FREE',
    "currency" VARCHAR(12),
    "recurringAmount" INTEGER,
    "billingInterval" VARCHAR(20),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "webhookId" VARCHAR(120) NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "dodoBusinessId" VARCHAR(80),
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "lastAttemptAt" TIMESTAMP(3),
    "processingError" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UsageCounter" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageKey" VARCHAR(80) NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_dodoCustomerId_key" ON "User"("dodoCustomerId");
CREATE UNIQUE INDEX "BillingSubscription_dodoSubscriptionId_key" ON "BillingSubscription"("dodoSubscriptionId");
CREATE INDEX "BillingSubscription_userId_status_idx" ON "BillingSubscription"("userId", "status");
CREATE INDEX "BillingSubscription_currentPeriodEnd_idx" ON "BillingSubscription"("currentPeriodEnd");
CREATE UNIQUE INDEX "BillingWebhookEvent_webhookId_key" ON "BillingWebhookEvent"("webhookId");
CREATE INDEX "BillingWebhookEvent_eventType_createdAt_idx" ON "BillingWebhookEvent"("eventType", "createdAt" DESC);
CREATE UNIQUE INDEX "UsageCounter_userId_usageKey_periodStart_key" ON "UsageCounter"("userId", "usageKey", "periodStart");
CREATE INDEX "UsageCounter_usageKey_periodStart_idx" ON "UsageCounter"("usageKey", "periodStart");

ALTER TABLE "BillingSubscription"
ADD CONSTRAINT "BillingSubscription_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UsageCounter"
ADD CONSTRAINT "UsageCounter_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
