import type { ChatImageAttachment } from "src/types/chat";

export type KnowledgeRoute = "conversation_only" | "rag" | "web" | "hybrid";

const PHILOSOPHY_PATTERN =
  /\b(philosophy|philosopher|socrates|plato|aristotle|nietzsche|stoic|stoicism|epicurean|camus|sartre|kant|hegel|dialectic|ethics|virtue|nihilism|existential|metaphysics|epistemology|ressentiment|logos|telos|justice|morality|wisdom)\b/i;

const WEB_TRIGGER_PATTERN =
  /\b(search|web|internet|online|look up|lookup|browse|google|find sources|source this|fact check|fact-check)\b/i;

const FRESHNESS_PATTERN =
  /\b(today|yesterday|tomorrow|current|currently|latest|recent|recently|news|new study|this week|this month|this year|202[0-9]|update|updates)\b/i;

const MIXED_COMPARISON_PATTERN =
  /\b(compare|comparison|relate|apply|connect|link|contrast|against|versus|vs\.?)\b/i;

export function decideKnowledgeRoute(params: {
  userContent: string;
  userAttachments?: ChatImageAttachment[];
  forceWebSearch?: boolean;
}): KnowledgeRoute {
  const { userContent, userAttachments = [], forceWebSearch = false } = params;

  if (userAttachments.length > 0) {
    return "conversation_only";
  }

  const normalized = userContent.trim();

  if (!normalized) {
    return "conversation_only";
  }

  if (forceWebSearch) {
    return "web";
  }

  const mentionsPhilosophy = PHILOSOPHY_PATTERN.test(normalized);
  const requestsWeb = WEB_TRIGGER_PATTERN.test(normalized);
  const needsFreshness = FRESHNESS_PATTERN.test(normalized);
  const blendsDomains = MIXED_COMPARISON_PATTERN.test(normalized);
  const shouldPreferWeb = requestsWeb || needsFreshness;

  if (shouldPreferWeb && (mentionsPhilosophy || blendsDomains)) {
    return "hybrid";
  }

  if (shouldPreferWeb) {
    return "web";
  }

  if (mentionsPhilosophy) {
    return "rag";
  }

  return "conversation_only";
}
