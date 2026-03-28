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
  SOCRATIC_PROMPT_SECTIONS,
  SOCRATIC_PROMPT_VERSION,
} from "src/server/ai/prompt-config";
import type { KnowledgeRoute } from "src/server/ai/source-router";
import type { WebSource } from "src/server/ai/web-search";

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
): string | Array<ChatCompletionContentPartText | ChatCompletionContentPartImage> {
  if (!attachments?.length) {
    return text;
  }

  const parts: Array<ChatCompletionContentPartText | ChatCompletionContentPartImage> = [];
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

  for (const attachment of attachments) {
    parts.push({
      type: "image_url",
      image_url: {
        url: attachment.dataUrl,
        detail: "high",
      },
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

function buildCorePolicyMessage() {
  const sectionOrder = ["SYSTEM_ROLE", "OBJECTIVE", "RULES", "STYLE", "OUTPUT"];

  const content = [
    "SYSTEM_ROLE",
    SOCRATIC_PROMPT_SECTIONS.role,
    "",
    "OBJECTIVE",
    SOCRATIC_PROMPT_SECTIONS.objective,
    "",
    "RULES",
    SOCRATIC_PROMPT_SECTIONS.rules,
    "",
    "STYLE",
    SOCRATIC_PROMPT_SECTIONS.style,
    "",
    "OUTPUT",
    SOCRATIC_PROMPT_SECTIONS.output,
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
  webSearchSummary?: string;
  webSearchSources?: WebSource[];
  knowledgeRoute: KnowledgeRoute;
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
          const excerpt = item.content.replace(/\s+/g, " ").trim().slice(0, 650);
          const chunkTypeLabel =
            item.chunkType === "explanation" ? "explanation" : "primary_text";
          return [
            `${index + 1}. [${item.author} - ${item.title} | ${chunkTypeLabel} | chunk ${item.chunkIndex}]`,
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
    params.conversationMemorySummary?.trim() || "No long-term session memory yet.",
    "",
    "USER_BELIEFS",
    formatBeliefContext(params.beliefContext),
    "",
    "RETRIEVED_PASSAGES",
    retrievedPassages,
    "",
    "WEB_FINDINGS",
    params.webSearchSummary?.trim() || "No live web findings for this turn.",
    "",
    "WEB_SOURCES",
    params.webSearchSources?.length
      ? params.webSearchSources
          .map((source, index) => `${index + 1}. ${source.title} - ${source.url}`)
          .join("\n")
      : "No web sources for this turn.",
  ].join("\n");

  return { content, sectionOrder };
}

function hasImageAttachments(messages: ConversationMessage[], userAttachments?: ChatImageAttachment[]) {
  return messages.some((message) => message.attachments?.length) || Boolean(userAttachments?.length);
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
  } = params;

  const corePolicy = buildCorePolicyMessage();
  const dynamicContext = buildDynamicContextMessage({
    beliefContext,
    conversationMemorySummary,
    retrievedContext,
    webSearchSummary,
    webSearchSources,
    knowledgeRoute,
  });
  const includesImages = hasImageAttachments(conversationHistory, userAttachments);

  const messages: PromptMessage[] = [
    { role: "system", content: corePolicy.content } satisfies ChatCompletionSystemMessageParam,
    { role: "system", content: dynamicContext.content } satisfies ChatCompletionSystemMessageParam,
    ...(includesImages
      ? ([
          {
            role: "system",
            content: [
              "VISION_MODE",
              "This conversation includes attached images.",
              "Use the image content directly when answering questions about what is visible.",
              "Never say you cannot inspect the image when image content is present in the prompt.",
              "If the user asks who a real person is from an image, do not identify them by name from the image alone.",
              "Instead, explain that you cannot verify identity from the image and describe visible details or context.",
            ].join("\n"),
          } satisfies ChatCompletionSystemMessageParam,
        ])
      : []),
    ...(webSearchSummary
      ? ([
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
        ])
      : []),
    ...conversationHistory.map((message) =>
      message.role === "user"
        ? ({
            role: "user",
            content: buildUserPromptContent(message.content, message.attachments),
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
      content: buildUserPromptContent(userContent ?? "", userAttachments),
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
      sectionOrder: [...corePolicy.sectionOrder, ...dynamicContext.sectionOrder],
    },
  };
}
