import { Prisma } from "@prisma/client";
import type { DebateTopicSource, DebateWinner } from "src/types/chat";
import {
  deepseek,
  getDeepSeekAuxModel,
  getDeepSeekChatModel,
} from "src/server/ai/providers";
import { prisma } from "src/server/db/client";
import {
  DEBATE_TOPIC_MAX_CHARS,
  getDebateDurationMeta,
  getDebateToneMeta,
  normalizeDebateTopic,
  type DebateDurationPreset,
  type DebateTone,
  validatePhilosophyTopicLightweight,
} from "src/lib/debate";

const DEFAULT_MODEL = getDeepSeekChatModel();

const AUX_MODEL = getDeepSeekAuxModel();

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;

type DebateSuggestionParams = {
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  userId?: string;
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
  "Authenticity is often just socially approved performance.",
  "Compassion without hierarchy of duties produces moral chaos.",
  "Most political tolerance masks contempt rather than respect.",
  "Consciousness is narrative theater, not a stable self.",
  "Justice and mercy are structurally incompatible in law.",
  "Human dignity is rhetoric unless backed by material guarantees.",
];

const TOPIC_DIVERSITY_LENSES = [
  "ethics",
  "political philosophy",
  "philosophy of mind",
  "epistemology",
  "metaphysics",
  "existentialism",
  "aesthetics",
  "philosophy of religion",
] as const;

function pickRandomUnique<T>(items: readonly T[], count: number) {
  const pool = [...items];
  const chosen: T[] = [];

  while (pool.length > 0 && chosen.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    const [item] = pool.splice(index, 1);
    if (item !== undefined) {
      chosen.push(item);
    }
  }

  return chosen;
}

function topicFingerprint(topic: string) {
  return normalizeDebateTopic(topic)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 2 &&
        ![
          "the",
          "and",
          "for",
          "with",
          "that",
          "this",
          "from",
          "about",
          "into",
          "without",
          "most",
          "more",
        ].includes(word),
    )
    .join(" ");
}

function areTopicsNearDuplicate(a: string, b: string) {
  const fa = topicFingerprint(a);
  const fb = topicFingerprint(b);

  if (!fa || !fb) {
    return false;
  }

  if (fa === fb || fa.includes(fb) || fb.includes(fa)) {
    return true;
  }

  const tokensA = new Set(fa.split(" "));
  const tokensB = new Set(fb.split(" "));
  const overlap = [...tokensA].filter((token) => tokensB.has(token)).length;
  const minSize = Math.max(1, Math.min(tokensA.size, tokensB.size));

  return overlap / minSize >= 0.7;
}

function filterDistinctTopics(
  candidates: string[],
  blockedTopics: string[] = [],
) {
  const distinct: string[] = [];

  for (const candidateRaw of candidates) {
    const candidate = normalizeDebateTopic(candidateRaw);
    if (!candidate) {
      continue;
    }

    const isBlocked = blockedTopics.some((blocked) =>
      areTopicsNearDuplicate(candidate, blocked),
    );
    const isDuplicate = distinct.some((existing) =>
      areTopicsNearDuplicate(candidate, existing),
    );

    if (!isBlocked && !isDuplicate) {
      distinct.push(candidate);
    }
  }

  return distinct;
}

const FALLBACK_VERDICT = {
  winner: "DRAW" as DebateWinner,
  verdictSummary:
    "The debate ended without a clean collapse on either side, but one side still left its core premise under-defended.",
  summary:
    "Both sides pressed the topic seriously. The exchange turned on whether the central premise could survive direct scrutiny under the chosen format.",
};

const DEBATE_DASHBOARD_VERSION = "debate-dashboard-v1";

function normalizeStoredDebateTone(tone: string | DebateTone): DebateTone {
  switch (tone as string) {
    case "RUTHLESS_RESPECTFUL":
      return "RUTHLESS_BLUNT";
    case "BLUNT_AGGRESSIVE":
      return "SIMPLE_CLEAR";
    case "TOUGH_POLISHED":
      return "ELITE_INTELLECTUAL_ELEGANT";
    case "RUTHLESS_BLUNT":
    case "SIMPLE_CLEAR":
    case "ELITE_INTELLECTUAL_ELEGANT":
      return tone as DebateTone;
    default:
      return "RUTHLESS_BLUNT";
  }
}

function toPrismaDebateTone(tone: DebateTone): DebateTone {
  return tone;
}

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
  const improvementSuggestions = Array.isArray(
    dashboard["improvementSuggestions"],
  )
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
  const userMessages = params.transcript.filter(
    (message) => message.role === "USER",
  );
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
  const topicWordCount = lightweight.normalizedTopic
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  if (
    lightweight.isValid ||
    !lightweight.normalizedTopic ||
    topicWordCount < 3
  ) {
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
    const diversityLenses = pickRandomUnique(TOPIC_DIVERSITY_LENSES, 3);

    const recentTopics = params.userId
      ? (
          await prisma.chatSession.findMany({
            where: {
              userId: params.userId,
              mode: "DEBATE",
              debateTopic: { not: null },
            },
            orderBy: { updatedAt: "desc" },
            take: 30,
            select: { debateTopic: true },
          })
        )
          .map((session) => session.debateTopic ?? "")
          .map((topic) => normalizeDebateTopic(topic))
          .filter((topic) => Boolean(topic))
      : [];

    const recentTopicsForPrompt = recentTopics.slice(0, 12);

    const completion = await deepseek.chat.completions.create({
      model: AUX_MODEL,
      temperature: 1.25,
      top_p: 0.95,
      max_tokens: 520,
      presence_penalty: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Generate philosophy debate topics as direct theses.",
            "Reply in strict JSON with a single key named topics whose value is an array of exactly 10 strings.",
            "Each topic must be debatable, vivid, and strong enough for a one-on-one intellectual argument.",
            "Avoid generic textbook wording and avoid semantic repeats.",
            "Do not output the same thesis with rephrased wording.",
            "Each thesis must be one sentence.",
            "At least one thesis should be high-risk and provocative but still philosophical.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Tone: ${toneMeta.label}.`,
            `Duration: ${durationMeta.label}.`,
            `Use three distinct philosophical lenses: ${diversityLenses.join(", ")}.`,
            "Give topics that work well in that format.",
            recentTopicsForPrompt.length > 0
              ? `Avoid these recent topics and close variants: ${recentTopicsForPrompt.join(" | ")}`
              : "",
          ].join(" "),
        },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return FALLBACK_TOPICS;
    }

    const parsed = JSON.parse(content) as { topics?: string[] };
    const rawTopics =
      parsed.topics?.filter(
        (topic): topic is string =>
          typeof topic === "string" && Boolean(topic.trim()),
      ) ?? [];

    const topics = filterDistinctTopics(rawTopics, recentTopics).slice(0, 3);

    if (topics.length === 3) {
      return topics;
    }

    const fallback = filterDistinctTopics(FALLBACK_TOPICS, [
      ...recentTopics,
      ...topics,
    ]).slice(0, 3 - topics.length);

    return [...topics, ...fallback].slice(0, 3);
  } catch {
    return pickRandomUnique(FALLBACK_TOPICS, 3);
  }
}

export async function generateDebateOpening(params: DebateOpeningParams) {
  const durationMeta = getDebateDurationMeta(params.durationPreset);
  const toneMeta = getDebateToneMeta(params.tone);
  const isShortDebate =
    params.durationPreset === "MIN_15" ||
    params.durationPreset === "MIN_20" ||
    params.durationPreset === "MIN_30";

  const openingLengthInstruction = (() => {
    switch (params.durationPreset) {
      case "MIN_15":
        return "Write exactly 2 compact paragraphs with a blank line between them. Keep each paragraph short and argument-dense.";
      case "MIN_20":
        return "Write exactly 2 compact paragraphs with a blank line between them. Keep each paragraph short and argument-dense.";
      case "MIN_30":
        return "Write 2-3 compact paragraphs with blank lines between them. Keep each paragraph short and argument-dense.";
      case "HOUR_1":
        return "Write 3-4 compact paragraphs with blank lines between them. Keep each paragraph short and argument-dense.";
      case "NO_TIMER":
      default:
        return "Write 3-4 compact paragraphs with blank lines between them. Keep each paragraph short and argument-dense.";
    }
  })();

  const openerMaxTokens = (() => {
    switch (params.durationPreset) {
      case "MIN_15":
        return 90;
      case "MIN_20":
        return 110;
      case "MIN_30":
        return 140;
      case "HOUR_1":
        return 300;
      case "NO_TIMER":
      default:
        return 180;
    }
  })();

  const fallbackOpening = isShortDebate
    ? `Your defense of ${params.userSide.toLowerCase()} sounds confident, but it leans on an unproven premise. I will defend ${params.aiSide.toLowerCase()}, and you now need to justify your core assumption directly.`
    : `Your position on "${params.topic}" sounds stronger than it is. You are treating ${params.userSide.toLowerCase()} as if it survives scrutiny automatically, but it collapses the moment we press its hidden premise. I will defend ${params.aiSide.toLowerCase()}, and you will need more than instinct to keep your position alive.`;

  const endsAsCompleteSentence = (text: string) =>
    /[.!?]["')\]]?\s*$/.test(text);

  const trimToLastCompleteSentence = (text: string) => {
    const lastPeriod = text.lastIndexOf(".");
    const lastExclamation = text.lastIndexOf("!");
    const lastQuestion = text.lastIndexOf("?");
    const cutIndex = Math.max(lastPeriod, lastExclamation, lastQuestion);

    if (cutIndex > 40) {
      return text.slice(0, cutIndex + 1).trim();
    }

    return text.trim();
  };

  try {
    const completion = await deepseek.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.85,
      max_tokens: openerMaxTokens,
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
            "Write the opening attack.",
            openingLengthInstruction,
            "Keep it complete and end on a full sentence.",
          ].join("\n"),
        },
      ],
    });

    let opening = completion.choices[0]?.message?.content?.trim() || "";
    const finishReason = completion.choices[0]?.finish_reason;

    if (!opening) {
      return fallbackOpening;
    }

    if (
      (finishReason === "length" || !endsAsCompleteSentence(opening)) &&
      !isShortDebate
    ) {
      try {
        const continuation = await deepseek.chat.completions.create({
          model: DEFAULT_MODEL,
          temperature: 0.4,
          max_tokens: 80,
          messages: [
            {
              role: "system",
              content:
                "Continue this debate opening from exactly where it stops. Return only continuation text. End on a complete sentence. No bullets.",
            },
            {
              role: "user",
              content: opening,
            },
          ],
        });

        const continuationText =
          continuation.choices[0]?.message?.content?.trim() || "";

        if (continuationText) {
          opening = `${opening} ${continuationText}`
            .replace(/\s+/g, " ")
            .trim();
        }
      } catch {
        // Use best-effort original opening if continuation fails.
      }
    }

    const finalizedOpening = endsAsCompleteSentence(opening)
      ? opening
      : trimToLastCompleteSentence(opening);

    return finalizedOpening || fallbackOpening;
  } catch {
    return fallbackOpening;
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
    const userStrengths = parsed.userStrengths
      ?.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
      .slice(0, 3);
    const userWeaknesses = parsed.userWeaknesses
      ?.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
      .slice(0, 3);
    const improvementSuggestions = parsed.improvementSuggestions
      ?.filter(
        (item): item is string =>
          typeof item === "string" && Boolean(item.trim()),
      )
      .slice(0, 3);

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
    tone: normalizeStoredDebateTone(session.debateTone),
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
    tone: normalizeStoredDebateTone(session.debateTone),
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
  const normalizedTopic = normalizeDebateTopic(params.topic);
  const normalizedUserSide = normalizeDebateTopic(params.userSide);
  const normalizedAiSide = normalizeDebateTopic(params.aiSide);

  const safeTitle = normalizedTopic.slice(0, 140);
  const safeTopic = normalizedTopic.slice(0, DEBATE_TOPIC_MAX_CHARS);
  const safeUserSide = normalizedUserSide.slice(0, 160);
  const safeAiSide = normalizedAiSide.slice(0, 160);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS);
  const opening = await generateDebateOpening({
    topic: safeTopic,
    tone: params.tone,
    durationPreset: params.durationPreset,
    userSide: safeUserSide,
    aiSide: safeAiSide,
  });
  const durationMeta = getDebateDurationMeta(params.durationPreset);

  return prisma.chatSession.create({
    data: {
      userId: params.userId,
      mode: "DEBATE",
      title: safeTitle,
      expiresAt,
      lastActivityAt: now,
      debateTone: toPrismaDebateTone(params.tone),
      debateDurationPreset: params.durationPreset,
      debateHasTimer: durationMeta.hasTimer,
      debateTopic: safeTopic,
      debateTopicSource: params.topicSource,
      userDebateSide: safeUserSide,
      aiDebateSide: safeAiSide,
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
