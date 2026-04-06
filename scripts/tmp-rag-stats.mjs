import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  const docs = await pool.query(
    'SELECT count(*)::int AS c FROM "KnowledgeDocument" WHERE "isActive" = true',
  );
  const chunks = await pool.query(
    'SELECT count(*)::int AS c FROM "KnowledgeChunk"',
  );
  const chunkType = await pool.query(
    'SELECT "chunkType", count(*)::int AS c FROM "KnowledgeChunk" GROUP BY "chunkType" ORDER BY c DESC',
  );
  const tokenStats = await pool.query(
    'SELECT avg("tokenCount")::float AS avg, percentile_cont(0.5) within group (order by "tokenCount")::float AS p50, min("tokenCount")::int AS min, max("tokenCount")::int AS max FROM "KnowledgeChunk"',
  );
  const dims = await pool.query(
    'SELECT count(*)::int AS total, count(*) FILTER (WHERE vector_dims("embedding") = 1536)::int AS dims1536 FROM "KnowledgeChunk" WHERE "embedding" IS NOT NULL',
  );
  const traces = await pool.query(
    'SELECT count(*)::int AS c, avg("retrievalLatencyMs")::float AS avg_ms, percentile_cont(0.5) within group (order by "retrievalLatencyMs")::float AS p50_ms, percentile_cont(0.95) within group (order by "retrievalLatencyMs")::float AS p95_ms FROM "RetrievalTrace" WHERE "retrievalLatencyMs" IS NOT NULL',
  );
  const selected = await pool.query(
    'SELECT avg(jsonb_array_length("selectedPassages"::jsonb))::float AS avg_selected, max(jsonb_array_length("selectedPassages"::jsonb))::int AS max_selected FROM "RetrievalTrace" WHERE "selectedPassages" IS NOT NULL',
  );
  const candidates = await pool.query(
    'SELECT count(*)::int AS total, avg(jsonb_array_length("lexicalCandidates"::jsonb))::float AS avg_lex, avg(jsonb_array_length("vectorCandidates"::jsonb))::float AS avg_vec, avg(jsonb_array_length("fusedCandidates"::jsonb))::float AS avg_fused, avg(jsonb_array_length("rerankedCandidates"::jsonb))::float AS avg_reranked, avg(case when jsonb_array_length("vectorCandidates"::jsonb) > 0 then 1 else 0 end)::float AS vector_usage_rate FROM "RetrievalTrace" WHERE "lexicalCandidates" IS NOT NULL AND "vectorCandidates" IS NOT NULL AND "fusedCandidates" IS NOT NULL AND "rerankedCandidates" IS NOT NULL',
  );
  const indexes = await pool.query(
    "SELECT indexname, indexdef FROM pg_indexes WHERE schemaname='public' AND tablename='KnowledgeChunk' ORDER BY indexname",
  );

  console.log(
    JSON.stringify(
      {
        activeDocuments: docs.rows[0]?.c ?? 0,
        totalChunks: chunks.rows[0]?.c ?? 0,
        chunkTypes: chunkType.rows,
        tokenStats: tokenStats.rows[0],
        embeddingDims: dims.rows[0],
        retrievalLatency: traces.rows[0],
        selectedPassages: selected.rows[0],
        candidateAverages: candidates.rows[0],
        indexes: indexes.rows,
      },
      null,
      2,
    ),
  );
} finally {
  await pool.end();
}
