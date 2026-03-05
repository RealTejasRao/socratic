import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export function buildSocraticPrompt(params: {
  conversationHistory: ConversationMessage[];
  userContent?: string;
  appendUserMessageToPrompt?: boolean;
}) {
  const {
    conversationHistory,
    userContent,
    appendUserMessageToPrompt = true,
  } = params;

  const messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }> = [{ role: "system", content: SOCRATIC_SYSTEM_PROMPT }];

  messages.push(...conversationHistory);

  if (appendUserMessageToPrompt && userContent) {
    messages.push({ role: "user", content: userContent });
  }

  return messages;
}
