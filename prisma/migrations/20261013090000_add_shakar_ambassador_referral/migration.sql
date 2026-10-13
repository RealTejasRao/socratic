DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ReferralCodeSubmission"
    GROUP BY "userId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot create ReferralCodeSubmission_userId_key because duplicate ReferralCodeSubmission.userId values exist.';
  END IF;
END $$;

ALTER TABLE "AmbassadorReferralCode"
ADD COLUMN IF NOT EXISTS "displayName" VARCHAR(120);

UPDATE "AmbassadorReferralCode"
SET "displayName" = 'Reem',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "normalizedCode" = 'REEM106'
  AND ("displayName" IS NULL OR "displayName" = '');

INSERT INTO "AmbassadorReferralCode" ("id", "code", "normalizedCode", "displayName")
VALUES ('ambassador_shakar', 'shakar', 'SHAKAR', 'Shakar')
ON CONFLICT ("normalizedCode") DO UPDATE
SET "code" = EXCLUDED."code",
    "displayName" = EXCLUDED."displayName",
    "updatedAt" = CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCodeSubmission_userId_key"
ON "ReferralCodeSubmission"("userId");
