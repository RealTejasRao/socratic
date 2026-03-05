import { generateReply } from "src/server/ai/orchestrator";

export async function generateAssistantReply(params: {
  sessionId: string;
  userContent: string;
  now: Date;
  expiresAt: Date;
  persistUserMessage?: boolean;
  appendUserMessageToPrompt?: boolean;
  maxTokens?: number;
}) {
  const orchestratorParams: {
    sessionId: string;
    userContent: string;
    now: Date;
    expiresAt: Date;
    persistUserMessage?: boolean;
    appendUserMessageToPrompt?: boolean;
    maxTokens?: number;
  } = {
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

  if (params.maxTokens !== undefined) {
    orchestratorParams.maxTokens = params.maxTokens;
  }

  return generateReply(orchestratorParams);
}
