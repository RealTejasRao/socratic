import { deepseek, getDeepSeekAuxModel } from "src/server/ai/providers";

const SESSION_TITLE_MAX_LENGTH = 80;
const SESSION_TITLE_MAX_WORDS = 6;

function fallbackSessionTitle(content: string) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  return normalized.slice(0, SESSION_TITLE_MAX_LENGTH);
}

function normalizeSessionTitle(rawTitle: string) {
  const normalized = rawTitle
    .replace(/[\r\n]+/g, " ")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/[.?!,:;]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  const words = normalized.split(" ").filter(Boolean).slice(0, SESSION_TITLE_MAX_WORDS);
  const title = words.join(" ").slice(0, SESSION_TITLE_MAX_LENGTH).trim();

  return title || null;
}

export async function generateSessionTitle(content: string) {
  const normalizedContent = content.replace(/\s+/g, " ").trim();

  if (!normalizedContent) {
    return null;
  }

  try {
    const completion = await deepseek.chat.completions.create({
      model: getDeepSeekAuxModel(),
      temperature: 0.2,
      max_tokens: 24,
      messages: [
        {
          role: "system",
          content: [
            "You write very short conversation titles.",
            "Return plain text only.",
            "Use at most 5 to 6 words.",
            "Do not use quotes.",
            "Do not add labels or punctuation unless essential.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Create a short chat title for this first message:\n${normalizedContent}`,
        },
      ],
    });

    const generatedTitle = normalizeSessionTitle(
      completion.choices[0]?.message?.content ?? "",
    );

    if (generatedTitle) {
      return generatedTitle;
    }
  } catch {
    // Fall back to the old deterministic title behavior if the model call fails.
  }

  return fallbackSessionTitle(normalizedContent);
}
