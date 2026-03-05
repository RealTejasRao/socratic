-- Add session scope to beliefs
ALTER TABLE "UserBelief" ADD COLUMN "sessionId" TEXT;

-- Backfill sessionId from source message when available
UPDATE "UserBelief" AS ub
SET "sessionId" = m."sessionId"
FROM "Message" AS m
WHERE ub."sourceMessageId" = m."id"
  AND ub."sessionId" IS NULL;

-- Remove beliefs that cannot be safely mapped to a session
DELETE FROM "UserBelief"
WHERE "sessionId" IS NULL;

ALTER TABLE "UserBelief" ALTER COLUMN "sessionId" SET NOT NULL;

-- Replace old uniqueness/indexes with session-scoped versions
DROP INDEX IF EXISTS "UserBelief_userId_type_beliefKey_key";
DROP INDEX IF EXISTS "UserBelief_userId_updatedAt_idx";

CREATE UNIQUE INDEX "UserBelief_userId_sessionId_type_beliefKey_key"
ON "UserBelief"("userId", "sessionId", "type", "beliefKey");

CREATE INDEX "UserBelief_userId_sessionId_updatedAt_idx"
ON "UserBelief"("userId", "sessionId", "updatedAt" DESC);

CREATE INDEX "UserBelief_sessionId_updatedAt_idx"
ON "UserBelief"("sessionId", "updatedAt" DESC);

ALTER TABLE "UserBelief"
ADD CONSTRAINT "UserBelief_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
