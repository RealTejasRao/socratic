import { generateReply } from "src/server/ai/orchestrator";

export async function generateAssistantReply(params: {
  userId: string;
  sessionId: string;
  userContent: string;
  now: Date;
  expiresAt: Date;
  persistUserMessage?: boolean;
  appendUserMessageToPrompt?: boolean;
  sourceUserMessageId?: string;
  runInsightExtraction?: boolean;
  replaceBeliefsForSourceMessage?: boolean;
  maxTokens?: number;
}) {
  const orchestratorParams: {
    userId: string;
    sessionId: string;
    userContent: string;
    now: Date;
    expiresAt: Date;
    persistUserMessage?: boolean;
    appendUserMessageToPrompt?: boolean;
    sourceUserMessageId?: string;
    runInsightExtraction?: boolean;
    replaceBeliefsForSourceMessage?: boolean;
    maxTokens?: number;
  } = {
    userId: params.userId,
    sessionId: params.sessionId,
    userContent: params.userContent,
    now: params.now,
    expiresAt: params.expiresAt,
  };

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

  return generateReply(orchestratorParams);
}
