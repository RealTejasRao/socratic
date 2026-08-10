UPDATE "AmbassadorReferralCode"
SET "code" = 'reem106',
    "normalizedCode" = 'REEM106',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "normalizedCode" = 'REEM';

INSERT INTO "AmbassadorReferralCode" ("id", "code", "normalizedCode")
VALUES ('ambassador_reem', 'reem106', 'REEM106')
ON CONFLICT ("normalizedCode") DO UPDATE
SET "code" = EXCLUDED."code",
    "updatedAt" = CURRENT_TIMESTAMP;
