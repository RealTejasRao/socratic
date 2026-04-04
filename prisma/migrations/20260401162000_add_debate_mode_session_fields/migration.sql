-- Backfilled migration present in DB history but missing locally.
-- This mirrors currently-observed DB structure for debate session fields.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    WHERE t.typname = 'DebateSide'
  ) THEN
    CREATE TYPE "DebateSide" AS ENUM ('AFFIRM', 'NEGATE');
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChatSession'
      AND column_name = 'debateTopic'
  ) THEN
    ALTER TABLE "ChatSession"
    ALTER COLUMN "debateTopic" TYPE VARCHAR(220);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChatSession'
      AND column_name = 'debateStatus'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChatSession'
      AND column_name = 'debateStartedAt'
  ) THEN
    CREATE INDEX IF NOT EXISTS "ChatSession_debateStatus_debateStartedAt_idx"
    ON "ChatSession"("debateStatus", "debateStartedAt" DESC);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChatSession'
      AND column_name = 'mode'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'ChatSession'
      AND column_name = 'createdAt'
  ) THEN
    CREATE INDEX IF NOT EXISTS "ChatSession_mode_createdAt_idx"
    ON "ChatSession"("mode", "createdAt" DESC);
  END IF;
END $$;
