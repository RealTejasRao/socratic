import { prisma } from "src/server/db/client";
import { Prisma } from "@prisma/client";
import type {
  ExtractedInsight,
  ExtractedInsightType,
} from "src/server/ai/insight-extractor";

const MIN_CONFIDENCE_TO_STORE = 0.65;
const MAX_INSIGHTS_PER_MESSAGE = 8;
const BELIEF_SIMILARITY_THRESHOLD = 0.75;

function normalizeBeliefKey(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function isUsefulInsight(statement: string) {
  const normalized = statement.trim();
  return normalized.length >= 8;
}

function normalizeForSimilarity(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(text: string) {
  return new Set(normalizeForSimilarity(text).split(" ").filter(Boolean));
}

function overlapSimilarity(a: string, b: string) {
  const aTokens = tokenSet(a);
  const bTokens = tokenSet(b);
  if (!aTokens.size || !bTokens.size) return 0;

  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }

  return overlap / Math.max(1, Math.min(aTokens.size, bTokens.size));
}

function areBeliefsSimilar(a: string, b: string) {
  const aNorm = normalizeForSimilarity(a);
  const bNorm = normalizeForSimilarity(b);
  if (!aNorm || !bNorm) return false;
  if (aNorm === bNorm) return true;
  return overlapSimilarity(aNorm, bNorm) >= BELIEF_SIMILARITY_THRESHOLD;
}

export async function storeRawInsightExtraction(params: {
  userId: string;
  sessionId: string;
  sourceMessageId?: string;
  inputText: string;
  model?: string;
  extractorVersion: string;
  extraction?: unknown;
  error?: string;
}) {
  await prisma.insightExtractionLog.create({
    data: {
      userId: params.userId,
      sessionId: params.sessionId,
      sourceMessageId: params.sourceMessageId ?? null,
      inputText: params.inputText,
      model: params.model ?? null,
      extractorVersion: params.extractorVersion,
      extraction: (params.extraction ?? null) as
        | Prisma.InputJsonValue
        | Prisma.NullableJsonNullValueInput,
      error: params.error ?? null,
    },
  });
}

export async function storeInsightsAsBeliefs(params: {
  userId: string;
  sessionId: string;
  sourceMessageId?: string;
  insights: ExtractedInsight[];
}) {
  const candidates = params.insights.slice(0, MAX_INSIGHTS_PER_MESSAGE);

  for (const insight of candidates) {
    if (insight.confidence < MIN_CONFIDENCE_TO_STORE) {
      continue;
    }

    if (!isUsefulInsight(insight.statement)) {
      continue;
    }

    const beliefKey = normalizeBeliefKey(insight.statement);
    if (!beliefKey) {
      continue;
    }

    await prisma.userBelief.upsert({
      where: {
        userId_sessionId_type_beliefKey: {
          userId: params.userId,
          sessionId: params.sessionId,
          type: insight.type as ExtractedInsightType,
          beliefKey,
        },
      },
      update: {
        belief: insight.statement,
        confidence: insight.confidence,
        sourceMessageId: params.sourceMessageId ?? null,
      },
      create: {
        userId: params.userId,
        sessionId: params.sessionId,
        belief: insight.statement,
        beliefKey,
        type: insight.type as ExtractedInsightType,
        confidence: insight.confidence,
        sourceMessageId: params.sourceMessageId ?? null,
      },
    });
  }
}

export async function deleteBeliefsForSourceMessage(params: {
  userId: string;
  sessionId: string;
  sourceMessageId: string;
}) {
  await prisma.userBelief.deleteMany({
    where: {
      userId: params.userId,
      sessionId: params.sessionId,
      sourceMessageId: params.sourceMessageId,
    },
  });
}

export async function getBeliefsForPrompt(params: {
  userId: string;
  sessionId: string;
  take?: number;
}) {
  const take = params.take ?? 5;
  const fetchLimit = Math.max(take * 4, 20);

  const rawBeliefs = await prisma.userBelief.findMany({
    where: {
      userId: params.userId,
      sessionId: params.sessionId,
      status: "ACTIVE",
    },
    orderBy: [{ updatedAt: "desc" }, { confidence: "desc" }],
    take: fetchLimit,
    select: {
      type: true,
      belief: true,
      confidence: true,
    },
  });

  return buildBeliefPromptContext(rawBeliefs, take);
}

export function buildBeliefPromptContext(
  rawBeliefs: Array<{
    type: "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION";
    belief: string;
    confidence: number;
  }>,
  take: number,
) {
  const merged: Array<{
    type: "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION";
    belief: string;
    confidence: number;
  }> = [];

  for (const belief of rawBeliefs) {
    const existing = merged.find(
      (item) =>
        item.type === belief.type &&
        areBeliefsSimilar(item.belief, belief.belief),
    );

    if (!existing) {
      merged.push({
        type: belief.type,
        belief: belief.belief,
        confidence: belief.confidence,
      });
      continue;
    }

    if (belief.confidence > existing.confidence) {
      existing.confidence = belief.confidence;
    }

    if (belief.belief.length > existing.belief.length) {
      existing.belief = belief.belief;
    }
  }

  return merged.slice(0, take);
}
