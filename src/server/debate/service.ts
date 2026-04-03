import {
  Prisma,
  type DebateDurationPreset,
  type DebateTone,
  type DebateTopicSource,
  type DebateWinner,
} from "@prisma/client";
import {
  deepseek,
  getDeepSeekAuxModel,
  getDeepSeekChatModel,
} from "src/server/ai/providers";
import { prisma } from "src/server/db/client";
import {
  getDebateDurationMeta,
  getDebateToneMeta,
  normalizeDebateTopic,
  validatePhilosophyTopicLightweight,
} from "src/lib/debate";

const DEFAULT_MODEL =
  getDeepSeekChatModel();

const AUX_MODEL = getDeepSeekAuxModel();

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

type DebateSuggestionParams = {
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
};

type DebateOpeningParams = {
  topic: string;
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  userSide: string;
  aiSide: string;
};

type DebateVerdictParams = {
  topic: string;
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  userSide: string;
  aiSide: string;
  transcript: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
};

export type DebateDashboard = {
  version: string;
  generatedAt: string;
  userBeliefsSummary: string;
  assistantCaseSummary: string;
  userStrengths: string[];
  userWeaknesses: string[];
  improvementSuggestions: string[];
};

const FALLBACK_TOPICS = [
  "Free will is an illusion people defend for emotional reasons.",
  "Stoicism is emotionally overrated in modern life.",
  "Moral progress is mostly a comforting myth.",
];

const FALLBACK_VERDICT = {
  winner: "DRAW" as DebateWinner,
  verdictSummary:
    "The debate ended without a clean collapse on either side, but one side still left its core premise under-defended.",
  summary:
    "Both sides pressed the topic seriously. The exchange turned on whether the central premise could survive direct scrutiny under the chosen format.",
};

const DEBATE_DASHBOARD_VERSION = "debate-dashboard-v1";

function parseDebateDashboard(meta: Prisma.JsonValue | null | undefined) {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return null;
  }

  const record = meta as Record<string, unknown>;
  const dashboard =
    record["dashboard"] && typeof record["dashboard"] === "object"
      ? (record["dashboard"] as Record<string, unknown>)
      : null;

  if (!dashboard) {
    return null;
  }

  const userBeliefsSummary = dashboard["userBeliefsSummary"];
  const assistantCaseSummary = dashboard["assistantCaseSummary"];
  const generatedAt = dashboard["generatedAt"];
  const version = dashboard["version"];
  const userStrengths = Array.isArray(dashboard["userStrengths"])
    ? dashboard["userStrengths"].filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const userWeaknesses = Array.isArray(dashboard["userWeaknesses"])
    ? dashboard["userWeaknesses"].filter(
        (item): item is string => typeof item === "string",
      )
    : [];
  const improvementSuggestions = Array.isArray(dashboard["improvementSuggestions"])
    ? dashboard["improvementSuggestions"].filter(
        (item): item is string => typeof item === "string",
      )
    : [];

  if (
    typeof userBeliefsSummary !== "string" ||
    typeof assistantCaseSummary !== "string" ||
    typeof generatedAt !== "string" ||
    typeof version !== "string"
  ) {
    return null;
  }

  return {
    version,
    generatedAt,
    userBeliefsSummary,
    assistantCaseSummary,
    userStrengths,
    userWeaknesses,
    improvementSuggestions,
  } satisfies DebateDashboard;
}

function buildFallbackDashboard(params: {
  transcript: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
  beliefs: Array<{ type: string; belief: string }>;
}): DebateDashboard {
  const userMessages = params.transcript.filter((message) => message.role === "USER");
  const assistantMessages = params.transcript.filter(
    (message) => message.role === "ASSISTANT",
  );
  const topBeliefs = params.beliefs.slice(0, 4).map((item) => item.belief);
  const userBeliefsSummary =
    topBeliefs.length > 0
      ? `Your position centered on ${topBeliefs.join("; ")}. Across the debate, those beliefs shaped the claims you kept returning to.`
      : "Your side relied more on live assertions in the exchange than on a stable set of clearly articulated beliefs.";
  const assistantCaseSummary =
    assistantMessages.length > 0
      ? "The model consistently pressured your premises, looked for hidden assumptions, and tried to force the burden of proof back onto you."
      : "The model's case summary could not be reconstructed cleanly from the transcript.";

  return {
    version: DEBATE_DASHBOARD_VERSION,
    generatedAt: new Date().toISOString(),
    userBeliefsSummary,
    assistantCaseSummary,
    userStrengths: [
      userMessages.length > 0
        ? "You stayed engaged and kept defending a recognizable thesis instead of abandoning the core dispute."
        : "You entered the debate with a clear enough position to generate a live exchange.",
      "You gave the model enough material to target, which means your position was substantive rather than empty.",
    ],
    userWeaknesses: [
      "Some claims were asserted faster than they were justified.",
      "The transcript suggests more pressure on conclusions than on the premises needed to support them.",
    ],
    improvementSuggestions: [
      "State your central premise earlier and defend it directly.",
      "Use one concrete example or distinction per reply instead of broad restatement.",
      "Answer the model's strongest objection before moving to a new point.",
    ],
  };
}

export function getDebateDurationMs(durationPreset: DebateDurationPreset) {
  const meta = getDebateDurationMeta(durationPreset);

  if (!meta.hasTimer || meta.minutes === null) {
    return null;
  }

  return meta.minutes * 60 * 1000;
}

export function getDebateEndsAt(
  startedAt: Date | null | undefined,
  durationPreset: DebateDurationPreset | null | undefined,
) {
  if (!startedAt || !durationPreset) {
    return null;
  }

  const durationMs = getDebateDurationMs(durationPreset);

  if (durationMs === null) {
    return null;
  }

  return new Date(startedAt.getTime() + durationMs);
}

export function getDebateTimeRemainingSeconds(params: {
  startedAt: Date | null | undefined;
  durationPreset: DebateDurationPreset | null | undefined;
  now?: Date;
}) {
  const endsAt = getDebateEndsAt(params.startedAt, params.durationPreset);

  if (!endsAt) {
    return null;
  }

  const now = params.now ?? new Date();
  return Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / 1000));
}

export async function validateDebateTopic(topic: string) {
  const lightweight = validatePhilosophyTopicLightweight(topic);

  if (lightweight.isValid || !lightweight.normalizedTopic) {
    return lightweight;
  }

  try {
    const completion = await deepseek.chat.completions.create({
      model: AUX_MODEL,
      temperature: 0.2,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You classify whether a proposed topic is philosophy-related enough for a philosophy debate product.",
            "Reply in strict JSON with keys: isValid(boolean), reason(string), reframingSuggestions(string[]).",
            "Accept topics in ethics, metaphysics, philosophy of mind, logic, epistemology, aesthetics, existentialism, political philosophy, and philosophy of religion.",
            "Reject celebrity topics, entertainment gossip, coding, business advice, sports, and current events unless clearly reframed as philosophical claims.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Topic: ${lightweight.normalizedTopic}`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return lightweight;
    }

    const parsed = JSON.parse(content) as {
      isValid?: boolean;
      reason?: string;
      reframingSuggestions?: string[];
    };

    return {
      isValid: parsed.isValid === true,
      normalizedTopic: lightweight.normalizedTopic,
      reason: parsed.reason || lightweight.reason,
      reframingSuggestions:
        parsed.reframingSuggestions?.filter(
          (suggestion): suggestion is string => typeof suggestion === "string",
        ) ?? lightweight.reframingSuggestions,
    };
  } catch {
    return lightweight;
  }
}

export async function generateDebateTopicSuggestions(
  params: DebateSuggestionParams,
) {
  try {
    const durationMeta = getDebateDurationMeta(params.durationPreset);
    const toneMeta = getDebateToneMeta(params.tone);

    const completion = await deepseek.chat.completions.create({
      model: AUX_MODEL,
      temperature: 0.9,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Generate philosophy debate topics as direct theses.",
            "Reply in strict JSON with a single key named topics whose value is an array of exactly 3 strings.",
            "Each topic must be debatable, vivid, and strong enough for a one-on-one intellectual argument.",
            "Avoid generic textbook wording.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Tone: ${toneMeta.label}.`,
            `Duration: ${durationMeta.label}.`,
            "Give topics that work well in that format.",
          ].join(" "),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return FALLBACK_TOPICS;
    }

    const parsed = JSON.parse(content) as { topics?: string[] };
    const topics =
      parsed.topics?.filter(
        (topic): topic is string => typeof topic === "string" && Boolean(topic.trim()),
      ) ?? [];

    return topics.slice(0, 3).length === 3 ? topics.slice(0, 3) : FALLBACK_TOPICS;
  } catch {
    return FALLBACK_TOPICS;
  }
}

export async function generateDebateOpening(params: DebateOpeningParams) {
  const durationMeta = getDebateDurationMeta(params.durationPreset);
  const toneMeta = getDebateToneMeta(params.tone);

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.85,
      max_tokens: params.durationPreset === "HOUR_1" ? 240 : 170,
      messages: [
        {
          role: "system",
          content: [
            "You are opening a philosophy debate.",
            "The user already chose their side. You take the opposite side and begin immediately.",
            "Attack the reasoning, not the person.",
            "Keep the tone premium, sharp, and controlled.",
            "Do not use bullets.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Topic: ${params.topic}`,
            `Tone: ${toneMeta.label}`,
            `Duration mode: ${durationMeta.label}`,
            `User side: ${params.userSide}`,
            `Your side: ${params.aiSide}`,
            "Write the opening attack. Short debates should be tighter. Long debates may be more layered.",
          ].join("\n"),
        },
      ],
    });

    return (
      completion.choices[0]?.message?.content?.trim() ||
      `Your position on "${params.topic}" sounds stronger than it is. You are treating ${params.userSide.toLowerCase()} as if it survives scrutiny automatically, but it collapses the moment we press its hidden premise. I will defend ${params.aiSide.toLowerCase()}, and you will need more than instinct to keep your position alive.`
    );
  } catch {
    return `Your position on "${params.topic}" sounds stronger than it is. You are treating ${params.userSide.toLowerCase()} as if it survives scrutiny automatically, but it collapses the moment we press its hidden premise. I will defend ${params.aiSide.toLowerCase()}, and you will need more than instinct to keep your position alive.`;
  }
}

export async function generateDebateVerdict(params: DebateVerdictParams) {
  const durationMeta = getDebateDurationMeta(params.durationPreset);
  const transcriptText = params.transcript
    .map(
      (message, index) =>
        `${index + 1}. ${message.role === "USER" ? "User" : "Assistant"}: ${message.content}`,
    )
    .join("\n\n");

  try {
    const completion = await deepseek.chat.completions.create({
      model: AUX_MODEL,
      temperature: 0.2,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are a neutral debate judge.",
            "Judge only the quality of reasoning in the transcript.",
            "Reply in strict JSON with keys winner, verdictSummary, summary.",
            "winner must be USER, ASSISTANT, or DRAW.",
            "verdictSummary should be one crisp paragraph.",
            "summary should be a short transcript summary suitable for a Show summary panel.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Topic: ${params.topic}`,
            `Tone: ${getDebateToneMeta(params.tone).label}`,
            `Duration: ${durationMeta.label}`,
            `User side: ${params.userSide}`,
            `Assistant side: ${params.aiSide}`,
            "",
            transcriptText,
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return FALLBACK_VERDICT;
    }

    const parsed = JSON.parse(content) as {
      winner?: DebateWinner;
      verdictSummary?: string;
      summary?: string;
    };

    return {
      winner:
        parsed.winner === "USER" ||
        parsed.winner === "ASSISTANT" ||
        parsed.winner === "DRAW"
          ? parsed.winner
          : FALLBACK_VERDICT.winner,
      verdictSummary:
        parsed.verdictSummary?.trim() || FALLBACK_VERDICT.verdictSummary,
      summary: parsed.summary?.trim() || FALLBACK_VERDICT.summary,
    };
  } catch {
    return FALLBACK_VERDICT;
  }
}

async function generateDebateDashboard(params: {
  topic: string;
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  userSide: string;
  aiSide: string;
  winner: DebateWinner | null;
  verdictSummary: string | null;
  summary: string | null;
  transcript: Array<{ role: "USER" | "ASSISTANT"; content: string }>;
  beliefs: Array<{
    type: "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION";
    belief: string;
    confidence: number;
  }>;
}) {
  const durationMeta = getDebateDurationMeta(params.durationPreset);
  const fallbackDashboard = buildFallbackDashboard({
    transcript: params.transcript,
    beliefs: params.beliefs,
  });
  const transcriptText = params.transcript
    .map(
      (message, index) =>
        `${index + 1}. ${message.role === "USER" ? "User" : "Assistant"}: ${message.content}`,
    )
    .join("\n\n");
  const beliefText =
    params.beliefs.length > 0
      ? params.beliefs
          .map(
            (belief, index) =>
              `${index + 1}. [${belief.type}] ${belief.belief} (confidence ${belief.confidence.toFixed(2)})`,
          )
          .join("\n")
      : "No durable user beliefs were extracted for this debate.";

  try {
    const completion = await deepseek.chat.completions.create({
      model: AUX_MODEL,
      temperature: 0.25,
      max_tokens: 950,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are generating a post-debate dashboard for the human participant.",
            "Return strict JSON with keys: userBeliefsSummary, assistantCaseSummary, userStrengths, userWeaknesses, improvementSuggestions.",
            "Each summary should be a compact paragraph.",
            "Each list should contain 3 concise string items.",
            "Focus on reasoning quality, structure, pressure handling, clarity, and burden of proof.",
            "Do not flatter. Be fair, specific, and useful.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Topic: ${params.topic}`,
            `Tone: ${getDebateToneMeta(params.tone).label}`,
            `Duration: ${durationMeta.label}`,
            `User side: ${params.userSide}`,
            `Assistant side: ${params.aiSide}`,
            `Winner: ${params.winner ?? "UNKNOWN"}`,
            `Verdict summary: ${params.verdictSummary ?? "None"}`,
            `Debate summary: ${params.summary ?? "None"}`,
            "",
            "Extracted user beliefs:",
            beliefText,
            "",
            "Transcript:",
            transcriptText,
          ].join("\n"),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return fallbackDashboard;
    }

    const parsed = JSON.parse(content) as {
      userBeliefsSummary?: string;
      assistantCaseSummary?: string;
      userStrengths?: string[];
      userWeaknesses?: string[];
      improvementSuggestions?: string[];
    };
    const userStrengths = parsed.userStrengths?.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    ).slice(0, 3);
    const userWeaknesses = parsed.userWeaknesses?.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    ).slice(0, 3);
    const improvementSuggestions = parsed.improvementSuggestions?.filter(
      (item): item is string => typeof item === "string" && Boolean(item.trim()),
    ).slice(0, 3);

    return {
      version: DEBATE_DASHBOARD_VERSION,
      generatedAt: new Date().toISOString(),
      userBeliefsSummary:
        parsed.userBeliefsSummary?.trim() ||
        fallbackDashboard.userBeliefsSummary,
      assistantCaseSummary:
        parsed.assistantCaseSummary?.trim() ||
        fallbackDashboard.assistantCaseSummary,
      userStrengths:
        userStrengths && userStrengths.length > 0
          ? userStrengths
          : fallbackDashboard.userStrengths,
      userWeaknesses:
        userWeaknesses && userWeaknesses.length > 0
          ? userWeaknesses
          : fallbackDashboard.userWeaknesses,
      improvementSuggestions:
        improvementSuggestions && improvementSuggestions.length > 0
          ? improvementSuggestions
          : fallbackDashboard.improvementSuggestions,
    } satisfies DebateDashboard;
  } catch {
    return buildFallbackDashboard({
      transcript: params.transcript,
      beliefs: params.beliefs,
    });
  }
}

export async function getOrCreateDebateDashboard(params: {
  sessionId: string;
  userId: string;
}) {
  const session = await prisma.chatSession.findFirst({
    where: {
      id: params.sessionId,
      userId: params.userId,
      mode: "DEBATE",
    },
    select: {
      id: true,
      title: true,
      debateTone: true,
      debateDurationPreset: true,
      debateTopic: true,
      userDebateSide: true,
      aiDebateSide: true,
      debateStatus: true,
      debateStartedAt: true,
      debateEndedAt: true,
      debateWinner: true,
      debateVerdictSummary: true,
      debateSummary: true,
      debateMeta: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      },
      beliefs: {
        where: { status: "ACTIVE" },
        orderBy: [{ updatedAt: "desc" }, { confidence: "desc" }],
        take: 8,
        select: {
          type: true,
          belief: true,
          confidence: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (
    !session.debateTone ||
    !session.debateDurationPreset ||
    !session.debateTopic ||
    !session.userDebateSide ||
    !session.aiDebateSide ||
    session.debateStatus !== "COMPLETED"
  ) {
    return null;
  }

  const cachedDashboard = parseDebateDashboard(session.debateMeta);

  if (cachedDashboard?.version === DEBATE_DASHBOARD_VERSION) {
    return {
      session,
      dashboard: cachedDashboard,
    };
  }

  const dashboard = await generateDebateDashboard({
    topic: session.debateTopic,
    tone: session.debateTone,
    durationPreset: session.debateDurationPreset,
    userSide: session.userDebateSide,
    aiSide: session.aiDebateSide,
    winner: session.debateWinner,
    verdictSummary: session.debateVerdictSummary,
    summary: session.debateSummary,
    transcript: session.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    beliefs: session.beliefs,
  });

  const nextMeta = {
    ...(session.debateMeta &&
    typeof session.debateMeta === "object" &&
    !Array.isArray(session.debateMeta)
      ? (session.debateMeta as Record<string, unknown>)
      : {}),
    dashboard,
  };

  await prisma.chatSession.update({
    where: { id: session.id },
    data: {
      debateMeta: nextMeta as Prisma.InputJsonValue,
    },
  });

  return {
    session: {
      ...session,
      debateMeta: nextMeta as Prisma.JsonValue,
    },
    dashboard,
  };
}

export async function finalizeDebateSession(params: { sessionId: string }) {
  const session = await prisma.chatSession.findUnique({
    where: { id: params.sessionId },
    select: {
      id: true,
      mode: true,
      debateTone: true,
      debateDurationPreset: true,
      debateTopic: true,
      userDebateSide: true,
      aiDebateSide: true,
      debateStatus: true,
      debateEndedAt: true,
      debateWinner: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          content: true,
        },
      },
    },
  });

  if (!session || session.mode !== "DEBATE") {
    return null;
  }

  if (
    session.debateStatus === "COMPLETED" &&
    session.debateEndedAt &&
    session.debateWinner
  ) {
    return session;
  }

  if (
    !session.debateTone ||
    !session.debateDurationPreset ||
    !session.debateTopic ||
    !session.userDebateSide ||
    !session.aiDebateSide
  ) {
    throw new Error("Debate session is missing required configuration.");
  }

  const verdict = await generateDebateVerdict({
    topic: session.debateTopic,
    tone: session.debateTone,
    durationPreset: session.debateDurationPreset,
    userSide: session.userDebateSide,
    aiSide: session.aiDebateSide,
    transcript: session.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  });

  const now = new Date();

  return prisma.chatSession.update({
    where: { id: session.id },
    data: {
      status: "CLOSED",
      endedAt: now,
      debateStatus: "COMPLETED",
      debateEndedAt: now,
      debateWinner: verdict.winner,
      debateVerdictSummary: verdict.verdictSummary,
      debateSummary: verdict.summary,
      debateMeta: {
        transcriptMessageCount: session.messages.length,
      } as Prisma.InputJsonValue,
    },
    select: {
      id: true,
      status: true,
      debateStatus: true,
      debateEndedAt: true,
      debateWinner: true,
      debateVerdictSummary: true,
      debateSummary: true,
    },
  });
}

export async function createDebateSession(params: {
  userId: string;
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  topic: string;
  topicSource: DebateTopicSource;
  userSide: string;
  aiSide: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
  const opening = await generateDebateOpening({
    topic: params.topic,
    tone: params.tone,
    durationPreset: params.durationPreset,
    userSide: params.userSide,
    aiSide: params.aiSide,
  });
  const durationMeta = getDebateDurationMeta(params.durationPreset);

  return prisma.chatSession.create({
    data: {
      userId: params.userId,
      mode: "DEBATE",
      title: normalizeDebateTopic(params.topic),
      expiresAt,
      lastActivityAt: now,
      debateTone: params.tone,
      debateDurationPreset: params.durationPreset,
      debateHasTimer: durationMeta.hasTimer,
      debateTopic: normalizeDebateTopic(params.topic),
      debateTopicSource: params.topicSource,
      userDebateSide: normalizeDebateTopic(params.userSide),
      aiDebateSide: normalizeDebateTopic(params.aiSide),
      debateStatus: "ACTIVE",
      debateStartedAt: now,
      messages: {
        create: {
          role: "ASSISTANT",
          content: opening,
          model: `${DEFAULT_MODEL} (debate-opening-v1)`,
        },
      },
    },
    select: {
      id: true,
      title: true,
      mode: true,
      status: true,
      debateTone: true,
      debateDurationPreset: true,
      debateHasTimer: true,
      debateTopic: true,
      debateTopicSource: true,
      userDebateSide: true,
      aiDebateSide: true,
      debateStatus: true,
      debateStartedAt: true,
      debateEndedAt: true,
      debateWinner: true,
      debateVerdictSummary: true,
      debateSummary: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          attachments: true,
          createdAt: true,
        },
      },
    },
  });
}
