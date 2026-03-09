export const RESPONSE_VALIDATION_VERSION = "validator-v1.0";

type ValidatorInput = {
  userContent: string;
  assistantContent: string;
  beliefStatements: string[];
  conversationMemorySummary: string | undefined;
};

export type ValidationResult = {
  version: string;
  score: number;
  flags: string[];
  summary: string;
};

const GENERIC_PATTERNS = [
  "it depends",
  "everyone is different",
  "as an ai",
  "i cannot",
  "it's important to",
];

function countQuestions(text: string) {
  return (text.match(/\?/g) ?? []).length;
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3);
}

function overlapScore(a: string, b: string) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) return 0;

  let overlap = 0;
  for (const token of setA) {
    if (setB.has(token)) overlap += 1;
  }

  return overlap / Math.max(1, Math.min(setA.size, setB.size));
}

export function validateSocraticResponse(input: ValidatorInput): ValidationResult {
  const flags: string[] = [];
  let score = 100;

  const assistant = input.assistantContent.trim();

  if (!assistant) {
    return {
      version: RESPONSE_VALIDATION_VERSION,
      score: 0,
      flags: ["empty_response"],
      summary: "Assistant response was empty.",
    };
  }

  const questionCount = countQuestions(assistant);
  if (questionCount > 2) {
    flags.push("too_many_questions");
    score -= 20;
  }

  const firstSentence = assistant.split(/[.!?]/)[0]?.trim().toLowerCase() ?? "";
  if (!firstSentence || firstSentence.endsWith("?")) {
    flags.push("missing_opening_observation");
    score -= 15;
  }

  const lowered = assistant.toLowerCase();
  if (GENERIC_PATTERNS.some((pattern) => lowered.includes(pattern))) {
    flags.push("generic_language");
    score -= 15;
  }

  if (assistant.length < 80) {
    flags.push("too_short");
    score -= 10;
  }

  const userOverlap = overlapScore(input.userContent, assistant);
  if (userOverlap < 0.12) {
    flags.push("low_user_context_grounding");
    score -= 15;
  }

  const beliefText = input.beliefStatements.join(" ");
  if (beliefText) {
    const beliefOverlap = overlapScore(beliefText, assistant);
    if (beliefOverlap < 0.08) {
      flags.push("low_belief_grounding");
      score -= 10;
    }
  }

  if (input.conversationMemorySummary?.trim()) {
    const memoryOverlap = overlapScore(input.conversationMemorySummary, assistant);
    if (memoryOverlap < 0.05) {
      flags.push("low_memory_grounding");
      score -= 5;
    }
  }

  if (score < 0) score = 0;

  const summary =
    flags.length === 0
      ? "Response passed baseline Socratic validation checks."
      : `Flags: ${flags.join(", ")}`;

  return {
    version: RESPONSE_VALIDATION_VERSION,
    score,
    flags,
    summary,
  };
}
