import "server-only";
import fs from "node:fs";
import path from "node:path";
import { getDailyIndex } from "@/src/lib/twa-daily";

export type DailyThoughtEntry = {
  quote: string;
  philosopher: string;
};

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return trimmed;
  }

  const startsWithQuote =
    trimmed.startsWith("\"") || trimmed.startsWith("'");
  const endsWithQuote = trimmed.endsWith("\"") || trimmed.endsWith("'");

  if (startsWithQuote && endsWithQuote) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function parseDailyThoughtMarkdown(markdown: string): DailyThoughtEntry[] {
  const entries: DailyThoughtEntry[] = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const splitIndex = line.indexOf("|");
    if (splitIndex === -1) {
      continue;
    }

    const quoteRaw = line.slice(0, splitIndex);
    const philosopherRaw = line.slice(splitIndex + 1);
    const quote = stripWrappingQuotes(quoteRaw);
    const philosopher = stripWrappingQuotes(philosopherRaw);

    if (!quote || !philosopher) {
      continue;
    }

    entries.push({ quote, philosopher });
  }

  return entries;
}

function parseDailyTopicMarkdown(markdown: string): string[] {
  const topics: string[] = [];

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const cleaned = line.replace(/^\d+\.\s*/, "").trim();
    if (!cleaned) {
      continue;
    }

    topics.push(cleaned);
  }

  return topics;
}

function readPublicFile(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

export function getTwaDailyContent(now: Date = new Date()) {
  const thoughtMarkdown = readPublicFile("public/twa/home/daily_thought.md");
  const topicMarkdown = readPublicFile("public/twa/home/daily_topic.md");

  const thoughts = parseDailyThoughtMarkdown(thoughtMarkdown);
  const topics = parseDailyTopicMarkdown(topicMarkdown);

  const thoughtIndex = getDailyIndex(now, thoughts.length);
  const topicIndex = getDailyIndex(now, topics.length);

  return {
    thoughts,
    topics,
    todayThought: thoughts[thoughtIndex] ?? null,
    todayTopic: topics[topicIndex] ?? null,
  };
}
