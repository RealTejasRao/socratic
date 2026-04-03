import { deepseek, getDeepSeekQueryRewriteModel } from "src/server/ai/providers";

const MAX_QUERY_CHARS = 400;
const QUERY_GEN_TIMEOUT_MS = 3500;
const MIN_REWRITE_WORDS = 8;
const MAX_REWRITE_WORDS = 60;

function normalizeQuery(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_CHARS);
}

function normalizeForComparison(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function looksKeywordLike(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;

  const commaCount = (trimmed.match(/,/g) ?? []).length;
  const hasSentencePunctuation = /[.?!:;]/.test(trimmed);
  const hasFunctionWords = /\b(of|and|that|which|including|because|through|against|between|into|with)\b/i.test(
    trimmed,
  );

  return commaCount >= 2 && !hasSentencePunctuation && !hasFunctionWords;
}

export async function generateRetrievalQuery(userMessage: string) {
  const fallback = normalizeQuery(userMessage);
  if (!fallback) {
    return fallback;
  }

  try {
    const model = getDeepSeekQueryRewriteModel();
    const controller = new AbortController();
    const timeoutMs = Number.parseInt(
      process.env["RETRIEVAL_QUERY_TIMEOUT_MS"] ?? `${QUERY_GEN_TIMEOUT_MS}`,
      10,
    );
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    let completion;
    try {
      completion = await deepseek.chat.completions.create(
        {
          model,
          temperature: 0.3,
          max_tokens: 80,
          messages: [
            {
              role: "system",
              content: [
                "Rewrite the user query into a semantically rich search query.",
                "Include related philosophical ideas and terminology.",
                "Expand the meaning, do not shorten it.",
                "Do NOT output keywords or comma-separated lists.",
                "Output a natural-language search sentence or phrase.",
                `The rewrite must be between ${MIN_REWRITE_WORDS} and ${MAX_REWRITE_WORDS} words.`,
                "Keep it under roughly 80 tokens.",
                "Do not answer the question, explain the answer, or add commentary.",
                "Only output the rewritten query text.",
                "Example input: Why did Nietzsche criticize Stoicism?",
                "Example output: Nietzsche's critique of Stoicism, including his rejection of passive acceptance, criticism of suppressing instincts, and opposition to philosophies that promote emotional detachment and living according to nature.",
                "Example input: What does Plato mean by the allegory of the cave?",
                "Example output: Plato's allegory of the cave as an account of appearance and reality, ignorance and education, the ascent of the soul toward knowledge, and the relation between visible experience and the world of forms.",
              ].join(" "),
            },
            {
              role: "user",
              content: [
                `Input: ${userMessage}`,
                "Output:",
              ].join("\n"),
            },
          ],
        },
        { signal: controller.signal },
      );
    } finally {
      clearTimeout(timeoutHandle);
    }

    const generated = completion.choices[0]?.message?.content ?? "";
    const normalized = normalizeQuery(generated);
    if (!normalized) {
      return fallback;
    }

    const wordCount = countWords(normalized);
    const sameAsInput =
      normalizeForComparison(normalized) === normalizeForComparison(fallback);

    if (
      sameAsInput ||
      wordCount < MIN_REWRITE_WORDS ||
      wordCount > MAX_REWRITE_WORDS ||
      looksKeywordLike(normalized)
    ) {
      return fallback;
    }

    return normalized;
  } catch {
    return fallback;
  }
}
