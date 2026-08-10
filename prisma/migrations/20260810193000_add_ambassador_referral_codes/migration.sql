CREATE TABLE "AmbassadorReferralCode" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "normalizedCode" VARCHAR(80) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbassadorReferralCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AmbassadorReferralCode_normalizedCode_key" ON "AmbassadorReferralCode"("normalizedCode");
CREATE INDEX "AmbassadorReferralCode_createdAt_idx" ON "AmbassadorReferralCode"("createdAt" DESC);

INSERT INTO "AmbassadorReferralCode" ("id", "code", "normalizedCode")
VALUES ('ambassador_reem', 'Reem', 'REEM')
ON CONFLICT ("normalizedCode") DO NOTHING;

ALTER TABLE "ReferralCodeSubmission" ADD COLUMN "ambassadorCodeId" TEXT;
CREATE INDEX "ReferralCodeSubmission_ambassadorCodeId_createdAt_idx" ON "ReferralCodeSubmission"("ambassadorCodeId", "createdAt" DESC);
ALTER TABLE "ReferralCodeSubmission" ADD CONSTRAINT "ReferralCodeSubmission_ambassadorCodeId_fkey" FOREIGN KEY ("ambassadorCodeId") REFERENCES "AmbassadorReferralCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
