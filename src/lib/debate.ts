export const DEBATE_TONE_OPTIONS = [
  {
    value: "RUTHLESS_RESPECTFUL",
    label: "Ruthless, Respectful",
    description: "Hard pressure, disciplined language, zero cheap shots.",
  },
  {
    value: "BLUNT_AGGRESSIVE",
    label: "Blunt, Aggressive",
    description: "Fast, sharp, confrontational, but still reason-focused.",
  },
  {
    value: "TOUGH_POLISHED",
    label: "Tough, Polished",
    description: "Elegant, cutting, and more intellectual in phrasing.",
  },
] as const;

export const DEBATE_DURATION_OPTIONS = [
  {
    value: "MIN_15",
    label: "15 min",
    description: "Rapid-fire pressure on the core claim.",
    minutes: 15,
    hasTimer: true,
  },
  {
    value: "MIN_20",
    label: "20 min",
    description: "Tight exchanges with room for one or two counterexamples.",
    minutes: 20,
    hasTimer: true,
  },
  {
    value: "MIN_30",
    label: "30 min",
    description: "Balanced pacing with deeper refinement and rebuttal.",
    minutes: 30,
    hasTimer: true,
  },
  {
    value: "HOUR_1",
    label: "1 hour",
    description: "Long-form philosophical combat with real depth.",
    minutes: 60,
    hasTimer: true,
  },
  {
    value: "NO_TIMER",
    label: "No timer",
    description: "Open-ended debate without countdown pressure.",
    minutes: null,
    hasTimer: false,
  },
] as const;

export const PHILOSOPHY_TOPIC_HINTS = [
  "ethics",
  "morality",
  "free will",
  "determinism",
  "consciousness",
  "meaning",
  "existentialism",
  "epistemology",
  "knowledge",
  "truth",
  "justice",
  "political philosophy",
  "stoicism",
  "nihilism",
  "utilitarianism",
  "virtue",
  "metaphysics",
  "identity",
  "mind",
  "reason",
  "logic",
  "god",
  "religion",
  "death",
  "beauty",
  "aesthetics",
  "plato",
  "aristotle",
  "socrates",
  "nietzsche",
  "kant",
  "camus",
  "descartes",
  "heidegger",
  "foucault",
  "marx",
  "mill",
];

export type DebateTone = (typeof DEBATE_TONE_OPTIONS)[number]["value"];
export type DebateDurationPreset =
  (typeof DEBATE_DURATION_OPTIONS)[number]["value"];

export type DebateTopicValidationResult = {
  isValid: boolean;
  normalizedTopic: string;
  reason?: string;
  reframingSuggestions: string[];
};

export function getDebateDurationMeta(duration: DebateDurationPreset) {
  return (
    DEBATE_DURATION_OPTIONS.find((option) => option.value === duration) ??
    DEBATE_DURATION_OPTIONS[2]
  );
}

export function getDebateToneMeta(tone: DebateTone) {
  return (
    DEBATE_TONE_OPTIONS.find((option) => option.value === tone) ??
    DEBATE_TONE_OPTIONS[0]
  );
}

export function normalizeDebateTopic(topic: string) {
  return topic.replace(/\s+/g, " ").trim();
}

export function validatePhilosophyTopicLightweight(
  topic: string,
): DebateTopicValidationResult {
  const normalizedTopic = normalizeDebateTopic(topic);

  if (!normalizedTopic) {
    return {
      isValid: false,
      normalizedTopic,
      reason: "Enter a philosophy topic or ask Socratic AI to generate one.",
      reframingSuggestions: [
        "Is free will an illusion?",
        "Does morality require God?",
        "Is stoicism emotionally dishonest?",
      ],
    };
  }

  const lowerTopic = normalizedTopic.toLowerCase();
  const matchedHint = PHILOSOPHY_TOPIC_HINTS.some((hint) =>
    lowerTopic.includes(hint),
  );

  const looksAbstract = /\b(should|is|can|must|ought|why|does)\b/.test(
    lowerTopic,
  );

  if (matchedHint || looksAbstract) {
    return {
      isValid: true,
      normalizedTopic,
      reframingSuggestions: [],
    };
  }

  return {
    isValid: false,
    normalizedTopic,
    reason:
      "That topic does not read as philosophy yet. Reframe it as a claim about truth, value, mind, meaning, ethics, freedom, knowledge, or political theory.",
    reframingSuggestions: [
      "Is ambition morally corrosive?",
      "Is happiness a poor standard for a good life?",
      "Do humans have intrinsic worth?",
    ],
  };
}

export function formatDebateCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
