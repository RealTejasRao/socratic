CREATE TABLE "ReferralCodeSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clerkUserId" VARCHAR(120) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "userAgent" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCodeSubmission_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ReferralCodeSubmission_code_createdAt_idx" ON "ReferralCodeSubmission"("code", "createdAt" DESC);
CREATE INDEX "ReferralCodeSubmission_userId_createdAt_idx" ON "ReferralCodeSubmission"("userId", "createdAt" DESC);
CREATE INDEX "ReferralCodeSubmission_createdAt_idx" ON "ReferralCodeSubmission"("createdAt" DESC);

ALTER TABLE "ReferralCodeSubmission" ADD CONSTRAINT "ReferralCodeSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
