import OpenAI from "openai";
import type { ChatImageAttachment } from "src/types/chat";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set`);
  }

  return value;
}

export const openai = new OpenAI({
  apiKey: requireEnv("OPENAI_API_KEY"),
});

export const deepseek = new OpenAI({
  apiKey: requireEnv("DEEPSEEK_API_KEY"),
  baseURL: process.env["DEEPSEEK_BASE_URL"] ?? "https://api.deepseek.com",
});

export function getDeepSeekChatModel() {
  return (
    process.env["DEEPSEEK_CHAT_MODEL"] ??
    process.env["OPENAI_CHAT_MODEL"] ??
    "deepseek-chat"
  );
}

export function getDeepSeekAuxModel() {
  return (
    process.env["DEEPSEEK_AUX_MODEL"] ??
    process.env["OPENAI_AUX_MODEL"] ??
    getDeepSeekChatModel()
  );
}

export function getDeepSeekQueryRewriteModel() {
  return (
    process.env["DEEPSEEK_QUERY_REWRITE_MODEL"] ??
    process.env["OPENAI_QUERY_REWRITE_MODEL"] ??
    process.env["OPENAI_ROUTER_MODEL"] ??
    getDeepSeekAuxModel()
  );
}

export function getDeepSeekDebateShortModel() {
  return (
    process.env["DEEPSEEK_DEBATE_SHORT_MODEL"] ??
    process.env["OPENAI_DEBATE_SHORT_MODEL"] ??
    getDeepSeekAuxModel()
  );
}

export function getDeepSeekDebateLongModel() {
  return (
    process.env["DEEPSEEK_DEBATE_LONG_MODEL"] ??
    process.env["OPENAI_DEBATE_LONG_MODEL"] ??
    getDeepSeekChatModel()
  );
}

export function getOpenAIVisionModel() {
  return process.env["OPENAI_VISION_MODEL"] ?? "gpt-4o-mini";
}

export function shouldUseVisionModel(
  attachments: ChatImageAttachment[] | undefined,
) {
  return Boolean(attachments?.length);
}
