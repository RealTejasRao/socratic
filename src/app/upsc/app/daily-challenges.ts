import { readFile } from "node:fs/promises";
import path from "node:path";

export type UpscDailyChallenge = {
  day: number;
  category: string;
  question: string;
  dateKey: string;
};

const CHALLENGE_FILE_PATH = path.join(
  process.cwd(),
  "public",
  "instruction",
  "instruction.txt",
);
const INDIA_UTC_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const CYCLE_START_DATE_KEY = "2026-08-28";

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

function parseChallenges(source: string) {
  return Array.from(
    source.matchAll(/### Day\s+(\d+)\s+.\s+([^\r\n]+)\s+\*\*([^*]+)\*\*/g),
  )
    .map((match) => {
      const day = Number(match[1]);
      const category = match[2]?.trim();
      const question = match[3]?.trim();

      if (!Number.isInteger(day) || !category || !question) {
        return null;
      }

      return { day, category, question };
    })
    .filter(
      (challenge): challenge is Omit<UpscDailyChallenge, "dateKey"> =>
        challenge !== null,
    );
}

export async function getTodayUpscChallenge(): Promise<UpscDailyChallenge | null> {
  const source = await readFile(CHALLENGE_FILE_PATH, "utf8");
  const challenges = parseChallenges(source);

  if (challenges.length === 0) {
    return null;
  }

  const dateKey = getIndiaDateKey();
  const challenge = challenges[getDayIndex(dateKey, challenges.length)];

  if (!challenge) {
    return null;
  }

  return {
    ...challenge,
    dateKey,
  };
}
