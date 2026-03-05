import {
  SOCRATIC_PROMPT_SECTIONS,
  SOCRATIC_PROMPT_VERSION,
} from "src/server/ai/prompt-config";
import { SOCRATIC_SYSTEM_PROMPT } from "src/server/ai/socratic-prompt";

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

export type BuiltPrompt = {
  messages: PromptMessage[];
  metadata: {
    promptVersion: string;
    estimatedInputTokens: number;
    sectionOrder: string[];
  };
};

function estimateTokensFromText(text: string) {
  // approximation for fast server-side accounting.
  return Math.ceil(text.length / 4);
}

function buildStructuredSystemPrompt() {
  const baseSectionOrder = [
    "SYSTEM_ROLE",
    "OBJECTIVE",
    "RULES",
    "STYLE",
  ];

  const systemPromptLines = [
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
  ];

  return { systemPromptLines, baseSectionOrder };
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

export function buildSocraticPrompt(params: {
  conversationHistory: ConversationMessage[];
  beliefContext?: BeliefContextItem[];
  userContent?: string;
  appendUserMessageToPrompt?: boolean;
}): BuiltPrompt {
  const {
    conversationHistory,
    beliefContext = [],
    userContent,
    appendUserMessageToPrompt = true,
  } = params;

  const { systemPromptLines, baseSectionOrder } = buildStructuredSystemPrompt();
  const sectionOrder = [...baseSectionOrder];

  const beliefSection = [
    "",
    "USER_BELIEFS",
    formatBeliefContext(beliefContext),
  ];
  sectionOrder.push("USER_BELIEFS");

  const legacySection = [
    "",
    "LEGACY_SOCRATIC_POLICY",
    SOCRATIC_SYSTEM_PROMPT.trim(),
  ];
  sectionOrder.push("LEGACY_SOCRATIC_POLICY");

  const systemPrompt = [...systemPromptLines, ...beliefSection, ...legacySection].join(
    "\n",
  );

  const messages: PromptMessage[] = [{ role: "system", content: systemPrompt }];

  messages.push(...conversationHistory);

  if (appendUserMessageToPrompt && userContent) {
    messages.push({ role: "user", content: userContent });
  }

  const promptText = messages.map((message) => message.content).join("\n");

  return {
    messages,
    metadata: {
      promptVersion: SOCRATIC_PROMPT_VERSION,
      estimatedInputTokens: estimateTokensFromText(promptText),
      sectionOrder,
    },
  };
}
