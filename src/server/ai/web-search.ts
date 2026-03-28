export type WebSource = {
  title: string;
  url: string;
};

export type WebSearchResult = {
  summary: string;
  sources: WebSource[];
  provider: "tavily";
};

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string;
  score?: number;
};

type TavilySearchResponse = {
  answer?: string;
  results?: TavilySearchResult[];
};

const DEFAULT_MAX_RESULTS = 5;

function looksNewsy(query: string) {
  return /\b(today|yesterday|tomorrow|latest|recent|news|this week|this month|this year|update|updates)\b/i.test(
    query,
  );
}

function cleanExcerpt(text: string | undefined, maxLength: number) {
  if (!text) {
    return "";
  }

  return text.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeSources(results: TavilySearchResult[] | undefined) {
  const deduped = new Map<string, WebSource>();

  for (const result of results ?? []) {
    if (!result.url || !result.title) {
      continue;
    }

    deduped.set(result.url, {
      title: result.title,
      url: result.url,
    });
  }

  return Array.from(deduped.values()).slice(0, DEFAULT_MAX_RESULTS);
}

function buildSummary(response: TavilySearchResponse) {
  const answer = cleanExcerpt(response.answer, 1200);
  const resultLines = (response.results ?? [])
    .slice(0, DEFAULT_MAX_RESULTS)
    .map((result, index) => {
      const title = result.title?.trim() || `Source ${index + 1}`;
      const excerpt =
        cleanExcerpt(result.raw_content, 700) ||
        cleanExcerpt(result.content, 420);

      if (!excerpt) {
        return `${index + 1}. ${title}`;
      }

      return `${index + 1}. [${title}] ${excerpt}`;
    });

  return [answer, ...resultLines].filter(Boolean).join("\n\n").trim();
}

export async function performWebSearch(userContent: string): Promise<WebSearchResult | null> {
  const tavilyApiKey = process.env["TAVILY_API_KEY"];

  if (!tavilyApiKey) {
    return null;
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tavilyApiKey}`,
    },
    body: JSON.stringify({
      query: userContent,
      topic: looksNewsy(userContent) ? "news" : "general",
      search_depth: "advanced",
      max_results: DEFAULT_MAX_RESULTS,
      include_answer: true,
      include_raw_content: true,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as TavilySearchResponse;
  const summary = buildSummary(payload);

  if (!summary) {
    return null;
  }

  return {
    summary,
    sources: normalizeSources(payload.results),
    provider: "tavily",
  };
}
