ALTER TABLE "KnowledgeChunk"
ADD COLUMN IF NOT EXISTS "content_tsv" tsvector
GENERATED ALWAYS AS (to_tsvector('english', "content")) STORED;

DROP INDEX IF EXISTS "KnowledgeChunk_content_tsv_idx";

CREATE INDEX "KnowledgeChunk_content_tsv_idx"
  ON "KnowledgeChunk" USING GIN ("content_tsv");
