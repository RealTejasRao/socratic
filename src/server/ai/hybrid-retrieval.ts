import { Prisma } from "@prisma/client";
import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";

const DEFAULT_VECTOR_LIMIT = 50;
const DEFAULT_LEXICAL_LIMIT = 50;
const DEFAULT_OUTPUT_LIMIT = 18;
const RRF_K = 60;
const EMBEDDING_TIMEOUT_MS = 1600;
const MIN_LEXICAL_ROWS_TO_SKIP_VECTOR = 20;
const MAX_LOOSE_LEXICAL_TERMS = 6;
const LOOSE_LEXICAL_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "always",
  "because",
  "been",
  "being",
  "both",
  "cant",
  "could",
  "doesn",
  "else",
  "from",
  "have",
  "important",
  "into",
  "just",
  "life",
  "live",
  "many",
  "more",
  "most",
  "much",
  "must",
  "only",
  "other",
  "over",
  "person",
  "really",
  "should",
  "some",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "think",
  "this",
  "through",
  "very",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "why",
  "with",
  "would",
]);
const SOURCE_SEEKING_PATTERNS = [
  /\baccording to\b/i,
  /\bwhat (did|does)\b/i,
  /\bwho said\b/i,
  /\bquote\b/i,
  /\bcitation\b/i,
  /\bsource\b/i,
  /\bpassage\b/i,
  /\bbook\b/i,
  /\btext\b/i,
  /\bauthor\b/i,
  /\bphilosopher\b/i,
  /\bplato\b/i,
  /\baristotle\b/i,
  /\bepictetus\b/i,
  /\bnietzsche\b/i,
  /\bhobbes\b/i,
  /\bcamus\b/i,
  /\bthoreau\b/i,
  /\bmachiavelli\b/i,
  /\baurelius\b/i,
  /\bthe republic\b/i,
  /\bthe prince\b/i,
  /\bleviathan\b/i,
  /\bmeditations\b/i,
  /\bdiscourses\b/i,
  /\bwalden\b/i,
  /\bnicomachean ethics\b/i,
  /\bbeyond good and evil\b/i,
  /\bmyth of sisyphus\b/i,
];
const AUTHOR_ALIASES: Array<{
  author: string;
  aliases: string[];
}> = [
  {
    author: "Adam Smith",
    aliases: ["adam smith", "smith"],
  },
  {
    author: "Albert Camus",
    aliases: ["albert camus", "camus"],
  },
  {
    author: "Aristotle",
    aliases: ["aristotle"],
  },
  {
    author: "Epictetus",
    aliases: ["epictetus"],
  },
  {
    author: "Friedrich Nietzsche",
    aliases: ["friedrich nietzsche", "nietzsche"],
  },
  {
    author: "Fyodor Dostoyevsky",
    aliases: ["fyodor dostoyevsky", "dostoyevsky"],
  },
  {
    author: "Henry David Thoreau",
    aliases: ["henry david thoreau", "thoreau"],
  },
  {
    author: "Immanuel Kant",
    aliases: ["immanuel kant", "kant"],
  },
  {
    author: "Jean Jacques Rousseau",
    aliases: ["jean jacques rousseau", "rousseau"],
  },
  {
    author: "Marcus Aurelius",
    aliases: ["marcus aurelius", "aurelius"],
  },
  {
    author: "Niccolo Machiavelli",
    aliases: ["niccolo machiavelli", "machiavelli"],
  },
  {
    author: "Plato",
    aliases: ["plato"],
  },
  {
    author: "Sigmund Freud",
    aliases: ["sigmund freud", "freud"],
  },
  {
    author: "Thomas Hobbes",
    aliases: ["thomas hobbes", "hobbes"],
  },
  {
    author: "Wright Mills",
    aliases: ["wright mills", "mills"],
  },
];

export type VectorCandidate = {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  chunkType: string;
  content: string;
  title: string;
  author: string;
  vectorScore: number;
};

export type LexicalCandidate = {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  chunkType: string;
  content: string;
  title: string;
  author: string;
  lexicalScore: number;
};

export type RetrievedPassage = {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  chunkType: string;
  content: string;
  title: string;
  author: string;
  vectorScore: number;
  lexicalScore: number;
  fusedScore: number;
  semanticScore: number;
  embeddingSimilarity: number;
  semanticRelevance: number;
  queryTypeFit: number;
  chunkTypeBoost: number;
};

function reciprocalRank(rank: number) {
  return 1 / (RRF_K + rank + 1);
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function embeddingToVectorLiteral(embedding: number[]) {
  return `[${embedding.join(",")}]`;
}

function hasExplicitSourceIntent(query: string) {
  return SOURCE_SEEKING_PATTERNS.some((pattern) => pattern.test(query));
}

function detectAuthorFilters(query: string) {
  const normalizedQuery = ` ${query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
  return AUTHOR_ALIASES.filter(({ aliases }) =>
    aliases.some((alias) => normalizedQuery.includes(` ${alias} `)),
  ).map(({ author }) => author);
}

function buildLooseLexicalQuery(query: string) {
  const uniqueTerms = new Set(
    query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 4)
      .filter((token) => !LOOSE_LEXICAL_STOPWORDS.has(token)),
  );

  return [...uniqueTerms].slice(0, MAX_LOOSE_LEXICAL_TERMS).join(" | ");
}

function detectQueryType(query: string) {
  const normalized = query.toLowerCase().trim();

  if (
    normalized.includes("difference between") ||
    normalized.includes("compare") ||
    normalized.includes("versus") ||
    normalized.includes(" vs ") ||
    normalized.includes("better than")
  ) {
    return "comparison" as const;
  }

  if (
    normalized.startsWith("what is ") ||
    normalized.startsWith("what are ") ||
    normalized.startsWith("define ") ||
    normalized.includes(" meaning of ")
  ) {
    return "definition" as const;
  }

  if (
    normalized.startsWith("why ") ||
    normalized.startsWith("how ") ||
    normalized.includes(" explain ") ||
    normalized.includes(" because ")
  ) {
    return "explanation" as const;
  }

  if (
    normalized.startsWith("should ") ||
    normalized.startsWith("must ") ||
    normalized.startsWith("ought ") ||
    normalized.startsWith("is it ") ||
    normalized.startsWith("can ") ||
    normalized.includes(" right ") ||
    normalized.includes(" wrong ")
  ) {
    return "argument" as const;
  }

  return "general" as const;
}

function detectQueryComplexity(query: string) {
  const normalized = query.toLowerCase().trim();
  const tokens = normalized.split(/\s+/).filter(Boolean);

  const beginnerSignals =
    normalized.startsWith("what is ") ||
    normalized.startsWith("what are ") ||
    normalized.startsWith("why ") ||
    normalized.startsWith("how ") ||
    normalized.includes("explain") ||
    normalized.includes("simple") ||
    normalized.includes("beginner");

  const advancedSignals =
    normalized.includes("compare") ||
    normalized.includes("versus") ||
    normalized.includes("contradiction") ||
    normalized.includes("tension") ||
    normalized.includes("critique") ||
    normalized.includes("analyze") ||
    normalized.includes("presupposition") ||
    normalized.includes("genealogy") ||
    tokens.length >= 18;

  if (advancedSignals) return "advanced" as const;
  if (beginnerSignals || tokens.length <= 10) return "beginner" as const;
  return "intermediate" as const;
}

function queryTypeFitScore(
  queryType:
    | "definition"
    | "explanation"
    | "argument"
    | "comparison"
    | "general",
  content: string,
) {
  const normalized = content.toLowerCase();

  if (queryType === "definition") {
    return /(?:\bis\b|\bmeans\b|\bdefined\b|\bconsists\b|\bessence\b)/.test(
      normalized,
    )
      ? 1
      : 0.35;
  }

  if (queryType === "explanation") {
    return /(?:\bbecause\b|\bsince\b|\btherefore\b|\bthus\b|\bleads to\b|\bresults in\b)/.test(
      normalized,
    )
      ? 1
      : 0.35;
  }

  if (queryType === "comparison") {
    return /(?:\bbetter\b|\bworse\b|\bmore\b|\bless\b|\bthan\b|\bwhereas\b|\bwhile\b|\brather than\b)/.test(
      normalized,
    )
      ? 1
      : 0.35;
  }

  if (queryType === "argument") {
    return /(?:\bshould\b|\bmust\b|\bought\b|\bgood\b|\bevil\b|\bjust\b|\bunjust\b|\bvirtue\b|\bvice\b)/.test(
      normalized,
    )
      ? 1
      : 0.35;
  }

  return 0.5;
}

function chunkTypeBoostScore(
  chunkType: string,
  queryType:
    | "definition"
    | "explanation"
    | "argument"
    | "comparison"
    | "general",
  queryComplexity: "beginner" | "intermediate" | "advanced",
) {
  if (chunkType === "explanation") {
    if (queryComplexity === "beginner") {
      return 0.1;
    }
    if (queryType === "definition" || queryType === "explanation") {
      return 0.08;
    }
    return 0;
  }

  if (chunkType === "primary_text") {
    if (queryComplexity === "advanced") {
      return 0.08;
    }
    if (queryType === "comparison" || queryType === "argument") {
      return 0.05;
    }
  }

  return 0;
}

async function embedQuery(query: string) {
  const model = process.env["OPENAI_EMBED_MODEL"] ?? "text-embedding-3-large";
  const timeoutMs = Number.parseInt(
    process.env["RETRIEVAL_EMBED_TIMEOUT_MS"] ?? `${EMBEDDING_TIMEOUT_MS}`,
    10,
  );
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  let embeddingResponse;
  try {
    embeddingResponse = await openai.embeddings.create(
      {
        model,
        input: query,
      },
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timeoutHandle);
  }

  return embeddingResponse.data[0]?.embedding ?? [];
}

function buildAuthorFilterSql(authors: string[]) {
  if (!authors.length) {
    return Prisma.empty;
  }

  return Prisma.sql`AND kd.author IN (${Prisma.join(authors)})`;
}

async function runVectorSearch(params: {
  embedding: number[];
  limit: number;
  authors?: string[];
}) {
  if (!params.embedding.length) {
    return [] as VectorCandidate[];
  }

  const vectorLiteral = embeddingToVectorLiteral(params.embedding);
  const authorFilterSql = buildAuthorFilterSql(params.authors ?? []);
  return prisma.$queryRaw<VectorCandidate[]>`
    SELECT
      kc.id AS "chunkId",
      kc."documentId" AS "documentId",
      kc."chunkIndex" AS "chunkIndex",
      kc."chunkType" AS "chunkType",
      kc.content AS "content",
      kd.title AS "title",
      kd.author AS "author",
      (1 - (kc.embedding <=> ${vectorLiteral}::vector)) AS "vectorScore"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND kc.embedding IS NOT NULL
      ${authorFilterSql}
    ORDER BY kc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${params.limit}
  `;
}

type SemanticScoreRow = {
  chunkId: string;
  embeddingSimilarity: number;
};

async function getSemanticSimilarityScores(params: {
  embedding: number[];
  candidateIds: string[];
}) {
  if (!params.embedding.length || !params.candidateIds.length) {
    return new Map<string, number>();
  }

  const vectorLiteral = embeddingToVectorLiteral(params.embedding);
  const rows = await prisma.$queryRaw<SemanticScoreRow[]>`
    SELECT
      kc.id AS "chunkId",
      (1 - (kc.embedding <=> ${vectorLiteral}::vector)) AS "embeddingSimilarity"
    FROM "KnowledgeChunk" kc
    WHERE kc.id IN (${Prisma.join(params.candidateIds)})
      AND kc.embedding IS NOT NULL
  `;

  return new Map(
    rows.map((row) => [row.chunkId, clamp01(row.embeddingSimilarity)]),
  );
}

async function runLexicalSearch(params: {
  query: string;
  limit: number;
  authors?: string[];
}) {
  const authorFilterSql = buildAuthorFilterSql(params.authors ?? []);
  return prisma.$queryRaw<LexicalCandidate[]>`
    SELECT
      kc.id AS "chunkId",
      kc."documentId" AS "documentId",
      kc."chunkIndex" AS "chunkIndex",
      kc."chunkType" AS "chunkType",
      kc.content AS "content",
      kd.title AS "title",
      kd.author AS "author",
      ts_rank_cd(
        to_tsvector('english', kc.content),
        websearch_to_tsquery('english', ${params.query})
      ) AS "lexicalScore"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND websearch_to_tsquery('english', ${params.query}) @@ to_tsvector('english', kc.content)
      ${authorFilterSql}
    ORDER BY "lexicalScore" DESC
    LIMIT ${params.limit}
  `;
}

async function runLooseLexicalSearch(params: {
  query: string;
  limit: number;
  authors?: string[];
}) {
  const authorFilterSql = buildAuthorFilterSql(params.authors ?? []);
  return prisma.$queryRaw<LexicalCandidate[]>`
    SELECT
      kc.id AS "chunkId",
      kc."documentId" AS "documentId",
      kc."chunkIndex" AS "chunkIndex",
      kc."chunkType" AS "chunkType",
      kc.content AS "content",
      kd.title AS "title",
      kd.author AS "author",
      ts_rank_cd(
        to_tsvector('english', kc.content),
        to_tsquery('english', ${params.query})
      ) AS "lexicalScore"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND to_tsquery('english', ${params.query}) @@ to_tsvector('english', kc.content)
      ${authorFilterSql}
    ORDER BY "lexicalScore" DESC
    LIMIT ${params.limit}
  `;
}

export async function retrieveHybridPassages(params: {
  query: string;
  vectorLimit?: number;
  lexicalLimit?: number;
  limit?: number;
}) {
  const details = await retrieveHybridPassagesWithDetails(params);
  return details.fusedCandidates.slice(0, params.limit ?? DEFAULT_OUTPUT_LIMIT);
}

export async function retrieveHybridPassagesWithDetails(params: {
  query: string;
  vectorLimit?: number;
  lexicalLimit?: number;
  limit?: number;
}) {
  const retrievalQuery = params.query.trim();
  const analysisQuery = retrievalQuery;

  if (!retrievalQuery) {
    return {
      vectorCandidates: [] as VectorCandidate[],
      lexicalCandidates: [] as LexicalCandidate[],
      fusedCandidates: [] as RetrievedPassage[],
    };
  }

  const vectorLimit = params.vectorLimit ?? DEFAULT_VECTOR_LIMIT;
  const lexicalLimit = params.lexicalLimit ?? DEFAULT_LEXICAL_LIMIT;
  const limit = params.limit ?? DEFAULT_OUTPUT_LIMIT;
  const authorFilters = detectAuthorFilters(retrievalQuery);
  const queryType = detectQueryType(analysisQuery);
  const queryComplexity = detectQueryComplexity(analysisQuery);

  let lexicalRows: LexicalCandidate[] = [];
  try {
    lexicalRows = await runLexicalSearch({
      query: retrievalQuery,
      limit: lexicalLimit,
      authors: authorFilters,
    });
    if (!lexicalRows.length) {
      const looseLexicalQuery = buildLooseLexicalQuery(retrievalQuery);
      if (looseLexicalQuery) {
        lexicalRows = await runLooseLexicalSearch({
          query: looseLexicalQuery,
          limit: lexicalLimit,
          authors: authorFilters,
        });
      }
    }
  } catch {
    lexicalRows = [];
  }

  const vectorRetrievalEnabled =
    process.env["RAG_VECTOR_RETRIEVAL_ENABLED"] === "true";
  const shouldRunVector =
    (lexicalRows.length < MIN_LEXICAL_ROWS_TO_SKIP_VECTOR &&
      (vectorRetrievalEnabled || hasExplicitSourceIntent(analysisQuery))) ||
    process.env["RAG_FORCE_VECTOR_RETRIEVAL"] === "true";

  let vectorRows: VectorCandidate[] = [];
  let queryEmbedding: number[] = [];
  if (shouldRunVector) {
    try {
      queryEmbedding = await embedQuery(retrievalQuery);
      vectorRows = await runVectorSearch({
        embedding: queryEmbedding,
        limit: vectorLimit,
        authors: authorFilters,
      });
    } catch {
      vectorRows = [];
      queryEmbedding = [];
    }
  }

  const merged = new Map<string, RetrievedPassage>();

  vectorRows.forEach((row, index) => {
    const fused = reciprocalRank(index);
    merged.set(row.chunkId, {
      chunkId: row.chunkId,
      documentId: row.documentId,
      chunkIndex: row.chunkIndex,
      chunkType: row.chunkType,
      content: row.content,
      title: row.title,
      author: row.author,
      vectorScore: row.vectorScore,
      lexicalScore: 0,
      fusedScore: fused,
      semanticScore: clamp01(row.vectorScore),
      embeddingSimilarity: clamp01(row.vectorScore),
      semanticRelevance: 0,
      queryTypeFit: 0,
      chunkTypeBoost: 0,
    });
  });

  lexicalRows.forEach((row, index) => {
    const fused = reciprocalRank(index);
    const existing = merged.get(row.chunkId);

    if (!existing) {
      merged.set(row.chunkId, {
        chunkId: row.chunkId,
        documentId: row.documentId,
        chunkIndex: row.chunkIndex,
        chunkType: row.chunkType,
        content: row.content,
        title: row.title,
        author: row.author,
        vectorScore: 0,
        lexicalScore: row.lexicalScore,
        fusedScore: fused,
        semanticScore: 0,
        embeddingSimilarity: 0,
        semanticRelevance: 0,
        queryTypeFit: 0,
        chunkTypeBoost: 0,
      });
      return;
    }

    existing.lexicalScore = row.lexicalScore;
    existing.fusedScore += fused;
  });

const sorted = [...merged.values()].sort((a, b) => b.fusedScore - a.fusedScore);

const perDocCap = 3;
const docCount = new Map<string, number>();
const fusedCandidates = sorted
  .filter((candidate) => {
    const count = docCount.get(candidate.documentId) ?? 0;
    if (count >= perDocCap) return false;
    docCount.set(candidate.documentId, count + 1);
    return true;
  })
  .slice(0, limit);

  if (!queryEmbedding.length && fusedCandidates.length) {
    try {
      queryEmbedding = await embedQuery(retrievalQuery);
    } catch {
      queryEmbedding = [];
    }
  }

  const semanticSimilarityMap = await getSemanticSimilarityScores({
    embedding: queryEmbedding,
    candidateIds: fusedCandidates.map((item) => item.chunkId),
  });

  fusedCandidates.forEach((candidate) => {
    const embeddingSimilarity =
      semanticSimilarityMap.get(candidate.chunkId) ??
      clamp01(candidate.vectorScore);
    const queryTypeFit = queryTypeFitScore(queryType, candidate.content);
    const chunkTypeBoost = chunkTypeBoostScore(
      candidate.chunkType,
      queryType,
      queryComplexity,
    );
    const semanticScore = embeddingSimilarity;
    const semanticRelevance = semanticScore;

    candidate.semanticScore = semanticScore;
    candidate.embeddingSimilarity = embeddingSimilarity;
    candidate.queryTypeFit = queryTypeFit;
    candidate.semanticRelevance = semanticRelevance;
    candidate.chunkTypeBoost = chunkTypeBoost;
  });

  return {
    vectorCandidates: vectorRows,
    lexicalCandidates: lexicalRows,
    fusedCandidates,
  };
}
