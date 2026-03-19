ALTER TABLE "KnowledgeChunk"
ADD COLUMN "chunkType" VARCHAR(32) NOT NULL DEFAULT 'primary_text';

CREATE INDEX "KnowledgeChunk_chunkType_idx" ON "KnowledgeChunk"("chunkType");
