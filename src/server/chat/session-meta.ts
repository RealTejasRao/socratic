import {
  getRoleplayPhilosopherConfig,
  type RoleplayPhilosopherId,
} from "src/lib/roleplay";
import type {
  ChatSessionMeta,
  DebateSessionState,
  RoleplaySessionState,
} from "src/types/chat";

type SessionShape = {
  id: string;
  title: string | null;
  mode: "SOCRATIC" | "DEBATE" | "ROLEPLAY";
  status: "ACTIVE" | "CLOSED" | "ARCHIVED";
  debateTone: "RUTHLESS_RESPECTFUL" | "BLUNT_AGGRESSIVE" | "TOUGH_POLISHED" | null;
  debateDurationPreset:
    | "MIN_15"
    | "MIN_20"
    | "MIN_30"
    | "HOUR_1"
    | "NO_TIMER"
    | null;
  debateHasTimer: boolean;
  debateTopic: string | null;
  debateTopicSource: "USER_PROVIDED" | "AI_GENERATED" | null;
  userDebateSide: string | null;
  aiDebateSide: string | null;
  debateStatus: "SETUP" | "ACTIVE" | "COMPLETED" | null;
  debateStartedAt: Date | null;
  debateEndedAt: Date | null;
  debateWinner: "USER" | "ASSISTANT" | "DRAW" | null;
  debateVerdictSummary: string | null;
  debateSummary: string | null;
  roleplayMeta?: unknown;
};

export function serializeDebateState(session: SessionShape): DebateSessionState | null {
  if (session.mode !== "DEBATE") {
    return null;
  }

  if (
    !session.debateTone ||
    !session.debateDurationPreset ||
    !session.debateTopic ||
    !session.debateTopicSource ||
    !session.userDebateSide ||
    !session.aiDebateSide ||
    !session.debateStatus
  ) {
    return null;
  }

  return {
    tone: session.debateTone,
    durationPreset: session.debateDurationPreset,
    hasTimer: session.debateHasTimer,
    topic: session.debateTopic,
    topicSource: session.debateTopicSource,
    userSide: session.userDebateSide,
    aiSide: session.aiDebateSide,
    status: session.debateStatus,
    startedAt: session.debateStartedAt?.toISOString() ?? null,
    endedAt: session.debateEndedAt?.toISOString() ?? null,
    winner: session.debateWinner,
    verdictSummary: session.debateVerdictSummary,
    summary: session.debateSummary,
  };
}

export function serializeSessionMeta(session: SessionShape): ChatSessionMeta {
  return {
    id: session.id,
    title: session.title,
    mode: session.mode,
    status: session.status,
    debate: serializeDebateState(session),
    roleplay: serializeRoleplayState(session),
  };
}

function serializeRoleplayState(session: SessionShape): RoleplaySessionState | null {
  if (session.mode !== "ROLEPLAY") {
    return null;
  }

  if (
    !session.roleplayMeta ||
    typeof session.roleplayMeta !== "object" ||
    Array.isArray(session.roleplayMeta)
  ) {
    return null;
  }

  const record = session.roleplayMeta as Record<string, unknown>;
  const philosopherId = record["philosopherId"];

  if (typeof philosopherId !== "string") {
    return null;
  }

  const philosopher = getRoleplayPhilosopherConfig(
    philosopherId as RoleplayPhilosopherId,
  );

  if (!philosopher) {
    return null;
  }

  return {
    philosopherId: philosopher.id,
    philosopherName: philosopher.name,
    imagePath: philosopher.imagePath,
    tradition: philosopher.tradition,
    schoolLabel: philosopher.schoolLabel,
    description: philosopher.description,
    introBlurb: philosopher.introBlurb,
    retrievalAuthors: [...philosopher.retrievalAuthors],
  };
}
