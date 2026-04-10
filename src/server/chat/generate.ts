import { generateReply } from "src/server/ai/orchestrator";
import type { ChatImageAttachment } from "src/types/chat";
import type { SocraticTone } from "src/lib/socratic";

export async function generateAssistantReply(params: {
  userId: string;
  sessionId: string;
  userContent: string;
  userAttachments?: ChatImageAttachment[];
  forceWebSearch?: boolean;
  now: Date;
  expiresAt: Date;
  persistUserMessage?: boolean;
  appendUserMessageToPrompt?: boolean;
  sourceUserMessageId?: string;
  runInsightExtraction?: boolean;
  replaceBeliefsForSourceMessage?: boolean;
  maxTokens?: number;
  socraticTone?: SocraticTone;
}) {
  const orchestratorParams: {
    userId: string;
    sessionId: string;
    userContent: string;
    userAttachments?: ChatImageAttachment[];
    forceWebSearch?: boolean;
    now: Date;
    expiresAt: Date;
    persistUserMessage?: boolean;
    appendUserMessageToPrompt?: boolean;
    sourceUserMessageId?: string;
    runInsightExtraction?: boolean;
    replaceBeliefsForSourceMessage?: boolean;
    maxTokens?: number;
    socraticTone?: SocraticTone;
  } = {
    userId: params.userId,
    sessionId: params.sessionId,
    userContent: params.userContent,
    now: params.now,
    expiresAt: params.expiresAt,
  };

  if (params.userAttachments !== undefined) {
    orchestratorParams.userAttachments = params.userAttachments;
  }

  if (params.forceWebSearch !== undefined) {
    orchestratorParams.forceWebSearch = params.forceWebSearch;
  }

  if (params.persistUserMessage !== undefined) {
    orchestratorParams.persistUserMessage = params.persistUserMessage;
  }

  if (params.appendUserMessageToPrompt !== undefined) {
    orchestratorParams.appendUserMessageToPrompt =
      params.appendUserMessageToPrompt;
  }

  if (params.sourceUserMessageId !== undefined) {
    orchestratorParams.sourceUserMessageId = params.sourceUserMessageId;
  }

  if (params.runInsightExtraction !== undefined) {
    orchestratorParams.runInsightExtraction = params.runInsightExtraction;
  }

  if (params.replaceBeliefsForSourceMessage !== undefined) {
    orchestratorParams.replaceBeliefsForSourceMessage =
      params.replaceBeliefsForSourceMessage;
  }

  if (params.maxTokens !== undefined) {
    orchestratorParams.maxTokens = params.maxTokens;
  }

  if (params.socraticTone !== undefined) {
    orchestratorParams.socraticTone = params.socraticTone;
  }

  return generateReply(orchestratorParams);
}
