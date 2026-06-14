export interface ChatImageAttachment {
  type: "image";
  dataUrl: string;
  mimeType: string;
  name: string;
  publicId?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  attachments?: ChatImageAttachment[];
  createdAt: string; // always string on client
}

import type { RoleplayPhilosopherId } from "src/lib/roleplay";

export type SessionMode = "SOCRATIC" | "DEBATE" | "ROLEPLAY";

export type DebateTone =
  | "RUTHLESS_BLUNT"
  | "SIMPLE_CLEAR"
  | "ELITE_INTELLECTUAL_ELEGANT";

export type DebateDurationPreset =
  | "MIN_15"
  | "MIN_20"
  | "MIN_30"
  | "HOUR_1"
  | "NO_TIMER";

export type DebateStatus = "SETUP" | "ACTIVE" | "COMPLETED";
export type DebateWinner = "USER" | "ASSISTANT" | "DRAW";
export type DebateTopicSource = "USER_PROVIDED" | "AI_GENERATED";

export interface DebateSessionState {
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  hasTimer: boolean;
  topic: string;
  topicSource: DebateTopicSource;
  userSide: string;
  aiSide: string;
  status: DebateStatus;
  startedAt: string | null;
  endedAt: string | null;
  winner: DebateWinner | null;
  verdictSummary: string | null;
  summary: string | null;
}

export interface RoleplaySessionState {
  philosopherId: RoleplayPhilosopherId;
  philosopherName: string;
  imagePath: string;
  flairs: string[];
  expertise: string;
  shortDescription: string;
  bestFor: string;
  starterPrompts: string[];
  voicePreview: string;
  accent: string;
}

export interface ChatSessionMeta {
  id?: string;
  title?: string | null;
  mode: SessionMode;
  status?: "ACTIVE" | "CLOSED" | "ARCHIVED";
  debate?: DebateSessionState | null;
  roleplay?: RoleplaySessionState | null;
}
