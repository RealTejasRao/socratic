import { prisma } from "src/server/db/client";
import type { BeliefType } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { ExtractedInsight } from "src/server/ai/insight-extractor";

const MIN_CONFIDENCE_TO_STORE = 0.65;
const MAX_INSIGHTS_PER_MESSAGE = 8;

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
          type: insight.type as BeliefType,
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
        type: insight.type as BeliefType,
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

  return prisma.userBelief.findMany({
    where: {
      userId: params.userId,
      sessionId: params.sessionId,
      status: "ACTIVE",
    },
    orderBy: [{ updatedAt: "desc" }, { confidence: "desc" }],
    take,
    select: {
      type: true,
      belief: true,
      confidence: true,
    },
  });
}
