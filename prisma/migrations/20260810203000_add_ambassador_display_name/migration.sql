ALTER TABLE "AmbassadorReferralCode" ADD COLUMN "displayName" VARCHAR(120) NOT NULL DEFAULT '';

UPDATE "AmbassadorReferralCode"
SET "displayName" = 'Reem',
    "code" = 'reem106',
    "normalizedCode" = 'REEM106',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "normalizedCode" IN ('REEM', 'REEM106');
