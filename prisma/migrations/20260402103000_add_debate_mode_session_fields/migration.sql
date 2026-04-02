-- Add debate mode to session enum
ALTER TYPE "SessionMode" ADD VALUE 'DEBATE';

-- Create debate enums
CREATE TYPE "DebateTone" AS ENUM (
  'RUTHLESS_RESPECTFUL',
  'BLUNT_AGGRESSIVE',
  'TOUGH_POLISHED'
);

CREATE TYPE "DebateDurationPreset" AS ENUM (
  'MIN_15',
  'MIN_20',
  'MIN_30',
  'HOUR_1',
  'NO_TIMER'
);

CREATE TYPE "DebateTopicSource" AS ENUM (
  'USER_PROVIDED',
  'AI_GENERATED'
);

CREATE TYPE "DebateStatus" AS ENUM (
  'SETUP',
  'ACTIVE',
  'COMPLETED'
);

CREATE TYPE "DebateWinner" AS ENUM (
  'USER',
  'ASSISTANT',
  'DRAW'
);

-- Add debate metadata to chat sessions
ALTER TABLE "ChatSession"
ADD COLUMN "debateTone" "DebateTone",
ADD COLUMN "debateDurationPreset" "DebateDurationPreset",
ADD COLUMN "debateHasTimer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "debateTopic" VARCHAR(240),
ADD COLUMN "debateTopicSource" "DebateTopicSource",
ADD COLUMN "userDebateSide" VARCHAR(160),
ADD COLUMN "aiDebateSide" VARCHAR(160),
ADD COLUMN "debateStatus" "DebateStatus",
ADD COLUMN "debateStartedAt" TIMESTAMP(3),
ADD COLUMN "debateEndedAt" TIMESTAMP(3),
ADD COLUMN "debateWinner" "DebateWinner",
ADD COLUMN "debateVerdictSummary" TEXT,
ADD COLUMN "debateSummary" TEXT,
ADD COLUMN "debateMeta" JSONB;
