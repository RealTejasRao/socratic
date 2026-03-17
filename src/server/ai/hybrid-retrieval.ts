import { Prisma } from "@prisma/client";
import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";

const DEFAULT_VECTOR_LIMIT = 20;
const DEFAULT_LEXICAL_LIMIT = 20;
const DEFAULT_OUTPUT_LIMIT = 5;
const RRF_K = 60;
const EMBEDDING_TIMEOUT_MS = 1600;
const MIN_LEXICAL_ROWS_TO_SKIP_VECTOR = 8;
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
  content: string;
  title: string;
  author: string;
  vectorScore: number;
};

export type LexicalCandidate = {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  title: string;
  author: string;
  lexicalScore: number;
};

export type RetrievedPassage = {
  chunkId: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  title: string;
  author: string;
  vectorScore: number;
  lexicalScore: number;
  fusedScore: number;
};

function reciprocalRank(rank: number) {
  return 1 / (RRF_K + rank + 1);
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

async function embedQuery(query: string) {
  const model = process.env["OPENAI_EMBED_MODEL"] ?? "text-embedding-3-small";
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
  query: string;
  limit: number;
  authors?: string[];
}) {
  const embedding = await embedQuery(params.query);
  if (!embedding.length) {
    return [] as VectorCandidate[];
  }

  const vectorLiteral = embeddingToVectorLiteral(embedding);
  const authorFilterSql = buildAuthorFilterSql(params.authors ?? []);
  return prisma.$queryRaw<VectorCandidate[]>`
    SELECT
      kc.id AS "chunkId",
      kc."documentId" AS "documentId",
      kc."chunkIndex" AS "chunkIndex",
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
  const query = params.query.trim();
  if (!query) {
    return {
      vectorCandidates: [] as VectorCandidate[],
      lexicalCandidates: [] as LexicalCandidate[],
      fusedCandidates: [] as RetrievedPassage[],
    };
  }

  const vectorLimit = params.vectorLimit ?? DEFAULT_VECTOR_LIMIT;
  const lexicalLimit = params.lexicalLimit ?? DEFAULT_LEXICAL_LIMIT;
  const limit = params.limit ?? DEFAULT_OUTPUT_LIMIT;
  const authorFilters = detectAuthorFilters(query);

  let lexicalRows: LexicalCandidate[] = [];
  try {
    lexicalRows = await runLexicalSearch({
      query,
      limit: lexicalLimit,
      authors: authorFilters,
    });
    if (!lexicalRows.length) {
      const looseLexicalQuery = buildLooseLexicalQuery(query);
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
      (vectorRetrievalEnabled || hasExplicitSourceIntent(query))) ||
    process.env["RAG_FORCE_VECTOR_RETRIEVAL"] === "true";

  let vectorRows: VectorCandidate[] = [];
  if (shouldRunVector) {
    try {
      vectorRows = await runVectorSearch({
        query,
        limit: vectorLimit,
        authors: authorFilters,
      });
    } catch {
      vectorRows = [];
    }
  }

  const merged = new Map<string, RetrievedPassage>();

  vectorRows.forEach((row, index) => {
    const fused = reciprocalRank(index);
    merged.set(row.chunkId, {
      chunkId: row.chunkId,
      documentId: row.documentId,
      chunkIndex: row.chunkIndex,
      content: row.content,
      title: row.title,
      author: row.author,
      vectorScore: row.vectorScore,
      lexicalScore: 0,
      fusedScore: fused,
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
        content: row.content,
        title: row.title,
        author: row.author,
        vectorScore: 0,
        lexicalScore: row.lexicalScore,
        fusedScore: fused,
      });
      return;
    }

    existing.lexicalScore = row.lexicalScore;
    existing.fusedScore += fused;
  });

  const fusedCandidates = [...merged.values()]
    .sort((a, b) => b.fusedScore - a.fusedScore)
    .slice(0, limit);

  return {
    vectorCandidates: vectorRows,
    lexicalCandidates: lexicalRows,
    fusedCandidates,
  };
}
