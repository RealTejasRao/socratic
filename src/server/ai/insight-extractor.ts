import { openai } from "src/server/ai/openai";

export const INSIGHT_EXTRACTOR_VERSION = "insight-v1.0";

export type ExtractedInsightType = "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION";

export type ExtractedInsight = {
  type: ExtractedInsightType;
  statement: string;
  confidence: number;
};

export type InsightExtractionResult = {
  insights: ExtractedInsight[];
  model?: string;
  raw: unknown;
};

type ExtractorPayload = {
  insights?: Array<{
    type?: string;
    statement?: string;
    confidence?: number;
  }>;
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toInsightType(value: string): ExtractedInsightType | null {
  const normalized = value.trim().toUpperCase();
  if (
    normalized === "BELIEF" ||
    normalized === "ASSUMPTION" ||
    normalized === "GOAL" ||
    normalized === "POSITION"
  ) {
    return normalized;
  }
  return null;
}

function clampConfidence(value: number) {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export async function extractInsightsFromMessage(
  userContent: string,
): Promise<InsightExtractionResult> {
  const completion = await openai.chat.completions.create({
    model: process.env["OPENAI_CHAT_MODEL"]!,
    temperature: 0.1,
    max_tokens: 350,
    messages: [
      {
        role: "system",
        content: [
          "You extract practical user insights for a Socratic reasoning system.",
          "Return strict JSON only with shape:",
          '{"insights":[{"type":"BELIEF|ASSUMPTION|GOAL|POSITION","statement":"string","confidence":0.0}]}',
          "Do not include markdown or prose.",
          "If no useful insight exists, return {\"insights\":[]}.",
        ].join(" "),
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  });

  const rawText = completion.choices[0]?.message?.content ?? "";
  const parsed = safeJsonParse(rawText) as ExtractorPayload | null;
  const rawInsights = parsed?.insights ?? [];

  const insights: ExtractedInsight[] = [];

  for (const item of rawInsights) {
    const typeValue = typeof item.type === "string" ? toInsightType(item.type) : null;
    const statementValue =
      typeof item.statement === "string" ? item.statement.trim() : "";
    const confidenceValue =
      typeof item.confidence === "number" ? clampConfidence(item.confidence) : 0;

    if (!typeValue || !statementValue) {
      continue;
    }

    insights.push({
      type: typeValue,
      statement: statementValue,
      confidence: confidenceValue,
    });
  }

  return {
    insights,
    model: completion.model,
    raw: parsed ?? rawText,
  };
}
