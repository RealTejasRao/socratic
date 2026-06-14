import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import type { ChatImageAttachment } from "src/types/chat";
import {
  DEBATE_PROMPT_SECTIONS,
  DEBATE_PROMPT_VERSION,
  SOCRATIC_RUTHLESS_BLUNT_TONE,
  ROLEPLAY_PROMPT_SECTIONS,
  ROLEPLAY_PROMPT_VERSION,
  SOCRATIC_SIMPLE_CLEAR_TONE,
  SOCRATIC_BALANCED_TONE,
  SOCRATIC_PROMPT_VERSION,
} from "src/server/ai/prompt-config";
import type { KnowledgeRoute } from "src/server/ai/source-router";
import type { WebSource } from "src/server/ai/web-search";
import {
  getDebateDurationMeta,
  getDebateToneMeta,
  type DebateDurationPreset,
  type DebateTone,
} from "src/lib/debate";
import { type SocraticTone } from "src/lib/socratic";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
  attachments?: ChatImageAttachment[];
};

type PromptMessage = ChatCompletionMessageParam;

type BeliefContextItem = {
  type: "BELIEF" | "ASSUMPTION" | "GOAL" | "POSITION";
  belief: string;
  confidence: number;
};

type RetrievedContextItem = {
  title: string;
  author: string;
  chunkType: string;
  content: string;
  chunkIndex: number;
};

export type BuiltPrompt = {
  messages: PromptMessage[];
  metadata: {
    promptVersion: string;
    estimatedInputTokens: number;
    sectionOrder: string[];
  };
};

type DebatePromptParams = {
  topic: string;
  tone: DebateTone;
  durationPreset: DebateDurationPreset;
  userSide: string;
  aiSide: string;
  hasTimer: boolean;
};

type RoleplayPromptParams = {
  philosopherName: string;
  flairs: string[];
  expertise: string;
  bestFor: string;
  schoolLabel: string;
  doctrineGuide: string;
  voiceGuide: string;
  openingPrompt: string;
  boundaries: string;
  retrievalAuthors: string[];
};

function estimateTokensFromText(text: string) {
  return Math.ceil(text.length / 4);
}

function estimateMessageTokens(message: PromptMessage) {
  if (message.content == null) {
    return 0;
  }

  if (typeof message.content === "string") {
    return estimateTokensFromText(message.content);
  }

  return message.content.reduce((total, part) => {
    if (part.type === "text") {
      return total + estimateTokensFromText(part.text);
    }

    return total + 255;
  }, 0);
}

function buildUserPromptContent(
  text: string,
  attachments: ChatImageAttachment[] | undefined,
  includeVisionContent = true,
):
  | string
  | Array<ChatCompletionContentPartText | ChatCompletionContentPartImage> {
  if (!attachments?.length) {
    return text;
  }

  const parts: Array<
    ChatCompletionContentPartText | ChatCompletionContentPartImage
  > = [];
  const imageCountLabel = attachments.length === 1 ? "image" : "images";

  parts.push({
    type: "text",
    text: [
      `The user attached ${attachments.length} ${imageCountLabel}.`,
      "Analyze the visible details in the attached image before answering.",
      "Do not claim you cannot view the image when an image is attached.",
      "If the request is to identify a real person, explain the limitation clearly and then describe what is visible instead.",
    ].join(" "),
  });

  if (text.trim()) {
    parts.push({
      type: "text",
      text: `User request: ${text}`,
    });
  }

  if (includeVisionContent) {
    for (const attachment of attachments) {
      parts.push({
        type: "image_url",
        image_url: {
          url: attachment.dataUrl,
          detail: "high",
        },
      });
    }
  } else {
    parts.push({
      type: "text",
      text: "Attached image content is omitted in this text-only provider route.",
    });
  }

  if (!parts.length) {
    parts.push({
      type: "text",
      text: "Please analyze the attached image carefully.",
    });
  }

  return parts;
}

function buildCorePolicyMessage(tone: SocraticTone) {
  const sectionOrder = ["SYSTEM_ROLE", "OBJECTIVE", "RULES", "STYLE", "OUTPUT"];
  const sections =
    tone === "RUTHLESS_BLUNT"
      ? SOCRATIC_RUTHLESS_BLUNT_TONE
      : tone === "SIMPLE_CLEAR"
        ? SOCRATIC_SIMPLE_CLEAR_TONE
        : SOCRATIC_BALANCED_TONE;

  const content = [
    "SYSTEM_ROLE",
    sections.role,
    "",
    "OBJECTIVE",
    sections.objective,
    "",
    "RULES",
    sections.rules,
    "",
    "STYLE",
    sections.style,
    "",
    "OUTPUT",
    sections.output,
  ].join("\n");

  return { content, sectionOrder };
}

function buildDebateCorePolicyMessage(params: DebatePromptParams) {
  const durationMeta = getDebateDurationMeta(params.durationPreset);
  const toneMeta = getDebateToneMeta(params.tone);
  const toneInstruction = (() => {
    switch (params.tone) {
      case "RUTHLESS_BLUNT":
        return "Keep a Blunt, ruthless, and unforgiving tone. Call out weak logic immediately. No softness, no padding. Be completely ruthless and Prioritize dismantling the argument over being informative.";

      case "SIMPLE_CLEAR":
        return "Keep Simple, clear, and sharp tone. Minimize the use of jargon or difficult vocabulary. Use plain language. But do not be soft, your goal is to destroy the user's arguments with your own. No jargon, no complexity.";

      case "ELITE_INTELLECTUAL_ELEGANT":
        return "Keep a elegant refined, and intellectually rigorous tone. Use advanced vocabulary and jargon. Your goal is to destroy user's arguments with intelligence. Stay controlled, never emotional.";

      default:
        return "Tone: Forceful and clear. Attack reasoning directly.";
    }
  })();

  // Separation
  const lengthInstruction = (() => {
    switch (params.durationPreset) {
      case "MIN_15":
        return "For 15-minute debates, use exactly 2 compact paragraphs, including the opening turn. Do not collapse into one long paragraph. Keep paragraph size consistent with Socratic-style compactness: usually 2 sentences per paragraph, 3 maximum.";
      case "MIN_20":
        return "For 20-minute debates, use exactly 2 compact paragraphs, including the opening turn. Do not collapse into one long paragraph. Keep paragraph size consistent with Socratic-style compactness: usually 2 sentences per paragraph, 3 maximum.";
      case "MIN_30":
        return "For 30-minute debates, use 2-3 compact paragraphs, including the opening turn. Keep paragraph size consistent with Socratic-style compactness: usually 2 sentences per paragraph, 3 maximum.";
      case "HOUR_1":
        return "For 1-hour debates, use 3-4 compact paragraphs, including the opening turn. Keep paragraph size consistent with Socratic-style compactness: usually 2 sentences per paragraph, 3 maximum.";
      case "NO_TIMER":
        return "For untimed debates, use 3-4 compact paragraphs, including the opening turn. Keep paragraph size consistent with Socratic-style compactness: usually 2 sentences per paragraph, 3 maximum.";
      default:
        return "Keep replies concise and argument-dense.";
    }
  })();

  const sectionOrder = [
    "SYSTEM_ROLE",
    "OBJECTIVE",
    "RULES",
    "STYLE",
    "DEBATE_CONFIG",
    "OUTPUT",
  ];

  const content = [
    "SYSTEM_ROLE",
    DEBATE_PROMPT_SECTIONS.role,
    "",
    "OBJECTIVE",
    DEBATE_PROMPT_SECTIONS.objective,
    "",
    "RULES",
    DEBATE_PROMPT_SECTIONS.rules,
    "",
    "STYLE",
    DEBATE_PROMPT_SECTIONS.style,
    "",
    "DEBATE_CONFIG",
    `Topic: ${params.topic}`,
    `User side: ${params.userSide}`,
    `Assistant side: ${params.aiSide}`,
    `Tone: ${toneMeta.label}`,
    toneInstruction,
    `Tone summary: ${toneMeta.description}`,
    `Duration: ${durationMeta.label}`,
    `Timer enabled: ${params.hasTimer ? "yes" : "no"}`,
    lengthInstruction,
    "",
    "OUTPUT",
    DEBATE_PROMPT_SECTIONS.output,
  ].join("\n");

  return { content, sectionOrder };
}

function buildRoleplayCorePolicyMessage(params: RoleplayPromptParams) {
  const sectionOrder = [
    "SYSTEM_ROLE",
    "OBJECTIVE",
    "RULES",
    "STYLE",
    "CHARACTER_CONFIG",
    "CHARACTER_METHOD",
    "OUTPUT",
  ];

  const content = [
    "SYSTEM_ROLE",
    ROLEPLAY_PROMPT_SECTIONS.role,
    "",
    "OBJECTIVE",
    ROLEPLAY_PROMPT_SECTIONS.objective,
    "",
    "RULES",
    ROLEPLAY_PROMPT_SECTIONS.rules,
    "",
    "STYLE",
    ROLEPLAY_PROMPT_SECTIONS.style,
    "",
    "CHARACTER_CONFIG",
    `Philosopher: ${params.philosopherName}`,
    `School flairs: ${params.flairs.join(", ")}`,
    `Expertise: ${params.expertise}`,
    `Best for: ${params.bestFor}`,
    `Intellectual territory: ${params.schoolLabel}`,
    `Doctrine guide: ${params.doctrineGuide}`,
    `Voice guide: ${params.voiceGuide}`,
    `Opening discipline: ${params.openingPrompt}`,
    `Boundaries: ${params.boundaries}`,
    "",
    "CHARACTER_METHOD",
    [
      "Respond as this philosopher-character in a live conversation.",
      "Apply the philosopher's expertise directly to the user's situation.",
      "Do not produce a detached school summary unless the user explicitly asks for explanation.",
      "Challenge the user when this philosopher would challenge them.",
      "Use retrieved passages only as quiet grounding; never discuss retrieval mechanics or hidden source routing.",
      params.retrievalAuthors.length
        ? `Internal grounding authors: ${params.retrievalAuthors.join(", ")}`
        : "Internal grounding authors: none specified.",
    ].join(" "),
    "",
    "OUTPUT",
    ROLEPLAY_PROMPT_SECTIONS.output,
  ].join("\n");

  return { content, sectionOrder };
}

function formatBeliefContext(beliefs: BeliefContextItem[]) {
  if (!beliefs.length) {
    return "No durable beliefs captured yet.";
  }

  return beliefs
    .map((item, index) => {
      const confidence = item.confidence.toFixed(2);
      return `${index + 1}. [${item.type}] ${item.belief} (confidence=${confidence})`;
    })
    .join("\n");
}

function buildDynamicContextMessage(params: {
  conversationMemorySummary: string | undefined;
  beliefContext: BeliefContextItem[];
  retrievedContext: RetrievedContextItem[];
  webSearchSummary: string | undefined;
  webSearchSources: WebSource[] | undefined;
  knowledgeRoute: KnowledgeRoute;
  retrievedPassageInstruction?: string;
}) {
  const sectionOrder = [
    "CONVERSATION_MEMORY",
    "USER_BELIEFS",
    "RETRIEVED_PASSAGES",
    "WEB_FINDINGS",
  ];

  const retrievedPassages = params.retrievedContext.length
    ? params.retrievedContext
        .map((item, index) => {
          const excerpt = item.content
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 1250);
          return [
            `${index + 1}. [${item.author}-${item.title}]`,
            `"${excerpt}"`,
          ].join("\n");
        })
        .join("\n\n")
    : "No retrieved passages for this turn.";

  const content = [
    "DYNAMIC_CONTEXT",
    "KNOWLEDGE_ROUTE",
    params.knowledgeRoute,
    "",
    "CONVERSATION_MEMORY",
    params.conversationMemorySummary?.trim() ||
      "No long-term session memory yet.",
    "",
    "USER_BELIEFS",
    formatBeliefContext(params.beliefContext),
    "",
    "RETRIEVED_PASSAGES",
    params.retrievedPassageInstruction ??
      "Citation format for retrieved passages: [Author- Book] only. If you use any retrieved passage, you must cite it. Never mention chunk numbers or chunk types.",
    "",
    retrievedPassages,
    "",
    "WEB_FINDINGS",
    params.webSearchSummary?.trim() || "No live web findings for this turn.",
    "",
    "WEB_SOURCES",
    params.webSearchSources?.length
      ? params.webSearchSources
          .map(
            (source, index) => `${index + 1}. ${source.title} - ${source.url}`,
          )
          .join("\n")
      : "No web sources for this turn.",
  ].join("\n");

  return { content, sectionOrder };
}

function hasImageAttachments(
  messages: ConversationMessage[],
  userAttachments?: ChatImageAttachment[],
) {
  return (
    messages.some((message) => message.attachments?.length) ||
    Boolean(userAttachments?.length)
  );
}

export function buildSocraticPrompt(params: {
  conversationHistory: ConversationMessage[];
  beliefContext?: BeliefContextItem[];
  retrievedContext?: RetrievedContextItem[];
  webSearchSummary?: string;
  webSearchSources?: WebSource[];
  conversationMemorySummary?: string;
  userContent?: string;
  userAttachments?: ChatImageAttachment[];
  appendUserMessageToPrompt?: boolean;
  knowledgeRoute?: KnowledgeRoute;
  includeVisionContent?: boolean;
  tone?: SocraticTone;
}): BuiltPrompt {
  const {
    conversationHistory,
    beliefContext = [],
    retrievedContext = [],
    webSearchSummary,
    webSearchSources,
    conversationMemorySummary,
    userContent,
    userAttachments,
    appendUserMessageToPrompt = true,
    knowledgeRoute = "conversation_only",
    includeVisionContent = true,
    tone = "SIMPLE_CLEAR",
  } = params;

  const corePolicy = buildCorePolicyMessage(tone);
  const dynamicContext = buildDynamicContextMessage({
    beliefContext,
    conversationMemorySummary,
    retrievedContext,
    webSearchSummary,
    webSearchSources,
    knowledgeRoute,
  });
  const includesImages =
    includeVisionContent &&
    hasImageAttachments(conversationHistory, userAttachments);

  const messages: PromptMessage[] = [
    {
      role: "system",
      content: corePolicy.content,
    } satisfies ChatCompletionSystemMessageParam,
    {
      role: "system",
      content: dynamicContext.content,
    } satisfies ChatCompletionSystemMessageParam,
    ...(includesImages
      ? [
          {
            role: "system",
            content: [
              "VISION_MODE",
              "This conversation includes attached images.",
              "Use the image content directly when answering questions about what is visible.",
              "Never say you cannot inspect the image when image content is present in the prompt.",
              "If the attached image is off-topic for philosophy or applied thinking, first identify what is visible in one brief sentence, Then immediately ask the user to connect or reframe the image into a philosophical question",
              "If the user asks who a real person is from an image, do not identify them by name from the image alone.",
              "Instead, explain that you cannot verify identity from the image and describe visible details or context.",
            ].join("\n"),
          } satisfies ChatCompletionSystemMessageParam,
        ]
      : []),
    ...(webSearchSummary
      ? [
          {
            role: "system",
            content: [
              "WEB_MODE",
              "Live web findings are included in the dynamic context for this turn.",
              "Base the response on those web findings for external or current facts.",
              "Do not fall back to retrieved book passages or stale model memory when web findings are present.",
              "If you rely on them, cite them inline as [Web: Source Title].",
              "Use the provided web findings directly in the answer, not as optional background.",
            ].join("\n"),
          } satisfies ChatCompletionSystemMessageParam,
        ]
      : []),
    ...conversationHistory.map((message) =>
      message.role === "user"
        ? ({
            role: "user",
            content: buildUserPromptContent(
              message.content,
              message.attachments,
              includeVisionContent,
            ),
          } satisfies ChatCompletionUserMessageParam)
        : ({
            role: "assistant",
            content: message.content,
          } satisfies ChatCompletionAssistantMessageParam),
    ),
  ];

  if (appendUserMessageToPrompt && (userContent || userAttachments?.length)) {
    messages.push({
      role: "user",
      content: buildUserPromptContent(
        userContent ?? "",
        userAttachments,
        includeVisionContent,
      ),
    } satisfies ChatCompletionUserMessageParam);
  }

  const promptText = messages
    .map((message) => estimateMessageTokens(message))
    .reduce((total, count) => total + count, 0);

  return {
    messages,
    metadata: {
      promptVersion: SOCRATIC_PROMPT_VERSION,
      estimatedInputTokens: promptText,
      sectionOrder: [
        ...corePolicy.sectionOrder,
        ...dynamicContext.sectionOrder,
      ],
    },
  };
}

export function buildDebatePrompt(params: {
  conversationHistory: ConversationMessage[];
  beliefContext?: BeliefContextItem[];
  retrievedContext?: RetrievedContextItem[];
  webSearchSummary?: string;
  webSearchSources?: WebSource[];
  conversationMemorySummary?: string;
  userContent?: string;
  userAttachments?: ChatImageAttachment[];
  appendUserMessageToPrompt?: boolean;
  knowledgeRoute?: KnowledgeRoute;
  debate: DebatePromptParams;
  includeVisionContent?: boolean;
}): BuiltPrompt {
  const {
    conversationHistory,
    beliefContext = [],
    retrievedContext = [],
    webSearchSummary,
    webSearchSources,
    conversationMemorySummary,
    userContent,
    userAttachments,
    appendUserMessageToPrompt = true,
    knowledgeRoute = "conversation_only",
    debate,
    includeVisionContent = true,
  } = params;

  const corePolicy = buildDebateCorePolicyMessage(debate);
  const dynamicContext = buildDynamicContextMessage({
    beliefContext,
    conversationMemorySummary,
    retrievedContext,
    webSearchSummary,
    webSearchSources,
    knowledgeRoute,
  });
  const includesImages =
    includeVisionContent &&
    hasImageAttachments(conversationHistory, userAttachments);

  const messages: PromptMessage[] = [
    {
      role: "system",
      content: corePolicy.content,
    } satisfies ChatCompletionSystemMessageParam,
    {
      role: "system",
      content: dynamicContext.content,
    } satisfies ChatCompletionSystemMessageParam,
    ...(includesImages
      ? [
          {
            role: "system",
            content: [
              "VISION_MODE",
              "This debate includes attached images.",
              "If the user uses an image as evidence, inspect it directly before responding.",
            ].join("\n"),
          } satisfies ChatCompletionSystemMessageParam,
        ]
      : []),
    ...conversationHistory.map((message) =>
      message.role === "user"
        ? ({
            role: "user",
            content: buildUserPromptContent(
              message.content,
              message.attachments,
              includeVisionContent,
            ),
          } satisfies ChatCompletionUserMessageParam)
        : ({
            role: "assistant",
            content: message.content,
          } satisfies ChatCompletionAssistantMessageParam),
    ),
  ];

  if (appendUserMessageToPrompt && (userContent || userAttachments?.length)) {
    messages.push({
      role: "user",
      content: buildUserPromptContent(
        userContent ?? "",
        userAttachments,
        includeVisionContent,
      ),
    } satisfies ChatCompletionUserMessageParam);
  }

  const promptText = messages
    .map((message) => estimateMessageTokens(message))
    .reduce((total, count) => total + count, 0);

  return {
    messages,
    metadata: {
      promptVersion: DEBATE_PROMPT_VERSION,
      estimatedInputTokens: promptText,
      sectionOrder: [
        ...corePolicy.sectionOrder,
        ...dynamicContext.sectionOrder,
      ],
    },
  };
}

export function buildRoleplayPrompt(params: {
  conversationHistory: ConversationMessage[];
  beliefContext?: BeliefContextItem[];
  retrievedContext?: RetrievedContextItem[];
  webSearchSummary?: string;
  webSearchSources?: WebSource[];
  conversationMemorySummary?: string;
  userContent?: string;
  userAttachments?: ChatImageAttachment[];
  appendUserMessageToPrompt?: boolean;
  knowledgeRoute?: KnowledgeRoute;
  roleplay: RoleplayPromptParams;
  includeVisionContent?: boolean;
}): BuiltPrompt {
  const {
    conversationHistory,
    beliefContext = [],
    retrievedContext = [],
    webSearchSummary,
    webSearchSources,
    conversationMemorySummary,
    userContent,
    userAttachments,
    appendUserMessageToPrompt = true,
    knowledgeRoute = "rag",
    roleplay,
    includeVisionContent = true,
  } = params;

  const corePolicy = buildRoleplayCorePolicyMessage(roleplay);
  const dynamicContext = buildDynamicContextMessage({
    beliefContext,
    conversationMemorySummary,
    retrievedContext,
    webSearchSummary,
    webSearchSources,
    knowledgeRoute,
    retrievedPassageInstruction:
      "Use these passages only as quiet grounding for the philosopher's reply. Do not cite them unless the user directly asks for sources, and never mention retrieval, context routing, chunk numbers, or system mechanics.",
  });
  const includesImages =
    includeVisionContent &&
    hasImageAttachments(conversationHistory, userAttachments);

  const messages: PromptMessage[] = [
    {
      role: "system",
      content: corePolicy.content,
    } satisfies ChatCompletionSystemMessageParam,
    {
      role: "system",
      content: dynamicContext.content,
    } satisfies ChatCompletionSystemMessageParam,
    ...(includesImages
      ? [
          {
            role: "system",
            content: [
              "VISION_MODE",
              "This roleplay conversation includes attached images.",
              "Use the visible content directly when the philosopher would reasonably comment on it.",
            ].join("\n"),
          } satisfies ChatCompletionSystemMessageParam,
        ]
      : []),
    ...conversationHistory.map((message) =>
      message.role === "user"
        ? ({
            role: "user",
            content: buildUserPromptContent(
              message.content,
              message.attachments,
              includeVisionContent,
            ),
          } satisfies ChatCompletionUserMessageParam)
        : ({
            role: "assistant",
            content: message.content,
          } satisfies ChatCompletionAssistantMessageParam),
    ),
  ];

  if (appendUserMessageToPrompt && (userContent || userAttachments?.length)) {
    messages.push({
      role: "user",
      content: buildUserPromptContent(
        userContent ?? "",
        userAttachments,
        includeVisionContent,
      ),
    } satisfies ChatCompletionUserMessageParam);
  }

  const promptText = messages
    .map((message) => estimateMessageTokens(message))
    .reduce((total, count) => total + count, 0);

  return {
    messages,
    metadata: {
      promptVersion: ROLEPLAY_PROMPT_VERSION,
      estimatedInputTokens: promptText,
      sectionOrder: [
        ...corePolicy.sectionOrder,
        ...dynamicContext.sectionOrder,
      ],
    },
  };
}
