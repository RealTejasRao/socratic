import type { ChatSessionMeta, DebateSessionState } from "src/types/chat";

type SessionShape = {
  id: string;
  title: string | null;
  mode: "SOCRATIC" | "DEBATE";
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
  };
}
