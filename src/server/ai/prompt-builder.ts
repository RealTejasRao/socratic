import {
  SOCRATIC_PROMPT_SECTIONS,
  SOCRATIC_PROMPT_VERSION,
} from "src/server/ai/prompt-config";

export type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

type PromptMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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
}) {
  const sectionOrder = [
    "CONVERSATION_MEMORY",
    "USER_BELIEFS",
    "RETRIEVED_PASSAGES",
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
    "CONVERSATION_MEMORY",
    params.conversationMemorySummary?.trim() || "No long-term session memory yet.",
    "",
    "USER_BELIEFS",
    formatBeliefContext(params.beliefContext),
    "",
    "RETRIEVED_PASSAGES",
    retrievedPassages,
  ].join("\n");

  return { content, sectionOrder };
}

export function buildSocraticPrompt(params: {
  conversationHistory: ConversationMessage[];
  beliefContext?: BeliefContextItem[];
  retrievedContext?: RetrievedContextItem[];
  conversationMemorySummary?: string;
  userContent?: string;
  appendUserMessageToPrompt?: boolean;
}): BuiltPrompt {
  const {
    conversationHistory,
    beliefContext = [],
    retrievedContext = [],
    conversationMemorySummary,
    userContent,
    appendUserMessageToPrompt = true,
  } = params;

  const corePolicy = buildCorePolicyMessage();
  const dynamicContext = buildDynamicContextMessage({
    beliefContext,
    conversationMemorySummary,
    retrievedContext,
  });

  const messages: PromptMessage[] = [
    { role: "system", content: corePolicy.content },
    { role: "system", content: dynamicContext.content },
    ...conversationHistory,
  ];

  if (appendUserMessageToPrompt && userContent) {
    messages.push({ role: "user", content: userContent });
  }

  const promptText = messages.map((message) => message.content).join("\n");

  return {
    messages,
    metadata: {
      promptVersion: SOCRATIC_PROMPT_VERSION,
      estimatedInputTokens: estimateTokensFromText(promptText),
      sectionOrder: [...corePolicy.sectionOrder, ...dynamicContext.sectionOrder],
    },
  };
}
