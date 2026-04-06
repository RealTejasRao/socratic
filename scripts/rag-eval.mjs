import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

loadEnv({ path: ".env.local" });

const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 1536;
const AUX_MODEL =
  process.env.DEEPSEEK_QUERY_REWRITE_MODEL ??
  process.env.DEEPSEEK_AUX_MODEL ??
  process.env.OPENAI_AUX_MODEL ??
  process.env.OPENAI_CHAT_MODEL ??
  "deepseek-chat";
const VECTOR_LIMIT = 20;
const LEXICAL_LIMIT = 20;
const CANDIDATE_LIMIT = 12;
const TOP_K = 5;
const RRF_K = 60;

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

if (!AUX_MODEL) {
  throw new Error("No rewrite model is configured");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const deepseek = process.env.DEEPSEEK_API_KEY
  ? new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
    })
  : null;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalize(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function reciprocalRank(rank) {
  return 1 / (RRF_K + rank + 1);
}

function overlapScore(a, b) {
  const tokenize = (value) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2);

  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (!aSet.size || !bSet.size) return 0;

  let overlap = 0;
  for (const token of aSet) {
    if (bSet.has(token)) overlap += 1;
  }
  return overlap / Math.max(1, Math.min(aSet.size, bSet.size));
}

function normalizeScores(values) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return values.map(() => 1);
  return values.map((v) => (v - min) / (max - min));
}

function embeddingToVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

async function generateRetrievalQuery(userMessage) {
  const started = Date.now();
  const rewriteClient = deepseek ?? openai;
  const completion = await rewriteClient.chat.completions.create({
    model: AUX_MODEL,
    temperature: 0.1,
    max_tokens: 120,
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
      { role: "user", content: userMessage },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() || userMessage;
  return {
    query: text,
    latencyMs: Date.now() - started,
  };
}

async function runHybridRetrieval(query) {
  const started = Date.now();
  const emb = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: query,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  const embedding = emb.data[0]?.embedding ?? [];
  if (!embedding.length) {
    return {
      candidates: [],
      latencyMs: Date.now() - started,
    };
  }

  const vectorLiteral = embeddingToVectorLiteral(embedding);
  const vectorRows = await prisma.$queryRaw`
    SELECT
      kc.id AS "chunkId",
      kc."documentId" AS "documentId",
      kc."chunkIndex" AS "chunkIndex",
      kc.content AS "content",
      kd.title AS "title",
      kd.author AS "author",
      (1 - (kc.embedding <=> ${vectorLiteral}::halfvec)) AS "vectorScore"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND kc.embedding IS NOT NULL
      AND vector_dims(kc.embedding) = ${EMBEDDING_DIMENSIONS}
    ORDER BY kc.embedding <=> ${vectorLiteral}::halfvec
    LIMIT ${VECTOR_LIMIT}
  `;

  const lexicalRows = await prisma.$queryRaw`
    SELECT
      kc.id AS "chunkId",
      kc."documentId" AS "documentId",
      kc."chunkIndex" AS "chunkIndex",
      kc.content AS "content",
      kd.title AS "title",
      kd.author AS "author",
      ts_rank_cd(
        to_tsvector('english', kc.content),
        plainto_tsquery('english', ${query})
      ) AS "lexicalScore"
    FROM "KnowledgeChunk" kc
    JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
    WHERE kd."isActive" = true
      AND plainto_tsquery('english', ${query}) @@ to_tsvector('english', kc.content)
    ORDER BY "lexicalScore" DESC
    LIMIT ${LEXICAL_LIMIT}
  `;

  const merged = new Map();

  vectorRows.forEach((row, index) => {
    merged.set(row.chunkId, {
      ...row,
      vectorScore: Number(row.vectorScore ?? 0),
      lexicalScore: 0,
      fusedScore: reciprocalRank(index),
    });
  });

  lexicalRows.forEach((row, index) => {
    const existing = merged.get(row.chunkId);
    const lexicalScore = Number(row.lexicalScore ?? 0);
    const rr = reciprocalRank(index);

    if (!existing) {
      merged.set(row.chunkId, {
        ...row,
        vectorScore: 0,
        lexicalScore,
        fusedScore: rr,
      });
      return;
    }

    existing.lexicalScore = lexicalScore;
    existing.fusedScore += rr;
  });

  const fused = [...merged.values()]
    .sort((a, b) => b.fusedScore - a.fusedScore)
    .slice(0, CANDIDATE_LIMIT);

  const normalizedFused = normalizeScores(fused.map((item) => item.fusedScore));
  const reranked = fused
    .map((item, index) => {
      const queryFit = overlapScore(query, item.content);
      const relevance = normalizedFused[index] * 0.7 + queryFit * 0.3;
      return {
        ...item,
        rerankScore: relevance,
      };
    })
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, TOP_K);

  return {
    candidates: reranked,
    latencyMs: Date.now() - started,
  };
}

function evaluateTopK(resultBooks, expectedBooks) {
  const expected = [...new Set(expectedBooks.map(normalize))];
  const seen = new Set();
  const uniqueResultBooks = [];

  for (const book of resultBooks) {
    const key = normalize(book);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueResultBooks.push(book);
  }

  const hitKeys = uniqueResultBooks
    .map((book) => normalize(book))
    .filter((book) => expected.includes(book));
  const uniqueHits = [...new Set(hitKeys)];
  const recallAtK = expected.length ? uniqueHits.length / expected.length : 0;

  let mrrAtK = 0;
  for (let i = 0; i < uniqueResultBooks.length; i += 1) {
    if (expected.includes(normalize(uniqueResultBooks[i]))) {
      mrrAtK = 1 / (i + 1);
      break;
    }
  }

  return {
    recallAtK,
    mrrAtK,
    hits: uniqueHits,
  };
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const casesPath = path.join(__dirname, "rag-eval-cases.json");
  const raw = await fs.readFile(casesPath, "utf8");
  const evalCases = JSON.parse(raw);

  if (!Array.isArray(evalCases) || !evalCases.length) {
    throw new Error("No evaluation cases found in scripts/rag-eval-cases.json");
  }

  const rows = [];
  for (const testCase of evalCases) {
    const generated = await generateRetrievalQuery(testCase.query);
    const retrieved = await runHybridRetrieval(generated.query);
    const topBooks = retrieved.candidates.map((item) => item.title);
    const metrics = evaluateTopK(topBooks, testCase.expectedBooks ?? []);

    rows.push({
      id: testCase.id,
      query: testCase.query,
      generatedQuery: generated.query,
      expectedBooks: testCase.expectedBooks ?? [],
      topBooks,
      recallAt5: metrics.recallAtK,
      mrrAt5: metrics.mrrAtK,
      hits: metrics.hits,
      queryGenLatencyMs: generated.latencyMs,
      retrievalLatencyMs: retrieved.latencyMs,
    });
  }

  const avgRecall =
    rows.reduce((sum, row) => sum + row.recallAt5, 0) /
    Math.max(1, rows.length);
  const avgMrr =
    rows.reduce((sum, row) => sum + row.mrrAt5, 0) / Math.max(1, rows.length);
  const avgQueryLatency =
    rows.reduce((sum, row) => sum + row.queryGenLatencyMs, 0) /
    Math.max(1, rows.length);
  const avgRetrievalLatency =
    rows.reduce((sum, row) => sum + row.retrievalLatencyMs, 0) /
    Math.max(1, rows.length);

  console.log("RAG Retrieval Evaluation");
  console.log("------------------------");
  console.log(`Cases: ${rows.length}`);
  console.log(`Avg Recall@5: ${avgRecall.toFixed(3)}`);
  console.log(`Avg MRR@5: ${avgMrr.toFixed(3)}`);
  console.log(`Avg Query-Gen Latency (ms): ${avgQueryLatency.toFixed(1)}`);
  console.log(`Avg Retrieval Latency (ms): ${avgRetrievalLatency.toFixed(1)}`);

  for (const row of rows) {
    console.log(`\n[${row.id}]`);
    console.log(`Query: ${row.query}`);
    console.log(`Generated: ${row.generatedQuery}`);
    console.log(`Expected: ${row.expectedBooks.join(" | ")}`);
    console.log(`Top@5: ${row.topBooks.join(" | ")}`);
    console.log(
      `Recall@5=${row.recallAt5.toFixed(3)} MRR@5=${row.mrrAt5.toFixed(3)} Hits=${row.hits.join(", ") || "none"}`,
    );
    console.log(
      `Latency(ms): queryGen=${row.queryGenLatencyMs} retrieval=${row.retrievalLatencyMs}`,
    );
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
  await pool.end();
}
