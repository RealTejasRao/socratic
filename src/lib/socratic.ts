export const SOCRATIC_TONE_OPTIONS = [
  {
    value: "BALANCED",
    label: "Encouraging and Supportive",
    description:
      "Thinks with you, not at you. Honest about the gaps, but never harsh about them.",
  },
  {
    value: "RUTHLESS_BLUNT",
    label: "Ruthless and Blunt",
    description: "Hard pressure, direct confrontation, no softness.",
  },
  {
    value: "SIMPLE_CLEAR",
    label: "Simple and Clear",
    description: "Plain language, sharp logic, easy to follow.",
  },
] as const;

export type SocraticTone = (typeof SOCRATIC_TONE_OPTIONS)[number]["value"];

export function isSocraticTone(value: unknown): value is SocraticTone {
  return SOCRATIC_TONE_OPTIONS.some((option) => option.value === value);
}

export function getSocraticToneMeta(tone: SocraticTone) {
  return (
    SOCRATIC_TONE_OPTIONS.find((option) => option.value === tone) ??
    SOCRATIC_TONE_OPTIONS[0]
  );
}
