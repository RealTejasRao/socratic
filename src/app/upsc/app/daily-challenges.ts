import { UPSC_SUGGESTION_QUESTIONS } from "@/src/lib/suggestion-questions";

export type UpscDailyChallenge = {
  day: number;
  category: string;
  question: string;
  dateKey: string;
};

const INDIA_UTC_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const CYCLE_START_DATE_KEY = "2026-08-28";
const CHALLENGE_CATEGORIES = [
  "Ethics",
  "GS",
  "Essay Thinking",
  "Interview",
  "Debate",
] as const;
const CHALLENGES: Omit<UpscDailyChallenge, "dateKey">[] =
  UPSC_SUGGESTION_QUESTIONS.map((question, index) => ({
    day: index + 1,
    category:
      CHALLENGE_CATEGORIES[index % CHALLENGE_CATEGORIES.length] ?? "GS",
    question,
  }));

function getIndiaDateKey(now = new Date()) {
  return new Date(now.getTime() + INDIA_UTC_OFFSET_MS)
    .toISOString()
    .slice(0, 10);
}

function getDayIndex(dateKey: string, challengeCount: number) {
  const currentDate = new Date(`${dateKey}T00:00:00.000Z`).getTime();
  const startDate = new Date(`${CYCLE_START_DATE_KEY}T00:00:00.000Z`).getTime();
  const elapsedDays = Math.max(
    0,
    Math.floor((currentDate - startDate) / 86_400_000),
  );

  return elapsedDays % challengeCount;
}

export async function getTodayUpscChallenge(): Promise<UpscDailyChallenge | null> {
  if (CHALLENGES.length === 0) {
    return null;
  }

  const dateKey = getIndiaDateKey();
  const challenge = CHALLENGES[getDayIndex(dateKey, CHALLENGES.length)];

  if (!challenge) {
    return null;
  }

  return {
    ...challenge,
    dateKey,
  };
}
