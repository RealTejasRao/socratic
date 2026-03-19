import { openai } from "src/server/ai/openai";

const MAX_QUERY_CHARS = 400;
const QUERY_GEN_TIMEOUT_MS = 1200;

function normalizeQuery(text: string) {
  return text.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_CHARS);
}

export async function generateRetrievalQuery(userMessage: string) {
  const fallback = normalizeQuery(userMessage);
  if (!fallback) {
    return fallback;
  }

  try {
    const model =
      process.env["OPENAI_ROUTER_MODEL"] ??
      process.env["OPENAI_AUX_MODEL"] ??
      process.env["OPENAI_CHAT_MODEL"]!;
    const controller = new AbortController();
    const timeoutMs = Number.parseInt(
      process.env["RETRIEVAL_QUERY_TIMEOUT_MS"] ?? `${QUERY_GEN_TIMEOUT_MS}`,
      10,
    );
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    let completion;
    try {
      completion = await openai.chat.completions.create(
        {
          model,
          temperature: 0.1,
          max_tokens: 80,
          messages: [
            {
              role: "system",
              content: [
                "Rewrite the user message into one retrieval-optimized search query for philosophy books.",
                "Expand with canonical philosophical terms and likely thinker anchors when relevant.",
                "Use concise keyword style, comma-separated phrases, no markdown.",
                "Do not answer the user. Output only the search query text.",
              ].join(" "),
            },
            {
              role: "user",
              content: userMessage,
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
    return normalized || fallback;
  } catch {
    return fallback;
  }
}
