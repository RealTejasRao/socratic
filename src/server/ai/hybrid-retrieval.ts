import { prisma } from "src/server/db/client";
import { openai } from "src/server/ai/openai";

const DEFAULT_VECTOR_LIMIT = 20;
const DEFAULT_LEXICAL_LIMIT = 20;
const DEFAULT_OUTPUT_LIMIT = 5;
const RRF_K = 60;

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

async function embedQuery(query: string) {
  const model = process.env["OPENAI_EMBED_MODEL"] ?? "text-embedding-3-small";
  const embeddingResponse = await openai.embeddings.create({
    model,
    input: query,
  });

  return embeddingResponse.data[0]?.embedding ?? [];
}

async function runVectorSearch(params: { query: string; limit: number }) {
  const embedding = await embedQuery(params.query);
  if (!embedding.length) {
    return [] as VectorCandidate[];
  }

  const vectorLiteral = embeddingToVectorLiteral(embedding);
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
    ORDER BY kc.embedding <=> ${vectorLiteral}::vector
    LIMIT ${params.limit}
  `;
}

async function runLexicalSearch(params: { query: string; limit: number }) {
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
        plainto_tsquery('english', ${params.query})
      ) AS "lexicalScore"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND plainto_tsquery('english', ${params.query}) @@ to_tsvector('english', kc.content)
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

  const [vectorRows, lexicalRows] = await Promise.all([
    runVectorSearch({ query, limit: vectorLimit }),
    runLexicalSearch({ query, limit: lexicalLimit }),
  ]);

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
