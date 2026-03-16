CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(220) NOT NULL,
    "author" VARCHAR(180) NOT NULL,
    "sourcePath" VARCHAR(800),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "tokenCount" INTEGER NOT NULL,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeDocument_author_title_key" ON "KnowledgeDocument"("author", "title");
CREATE INDEX "KnowledgeDocument_isActive_updatedAt_idx" ON "KnowledgeDocument"("isActive", "updatedAt" DESC);
CREATE UNIQUE INDEX "KnowledgeChunk_documentId_chunkIndex_key" ON "KnowledgeChunk"("documentId", "chunkIndex");
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");
CREATE INDEX "KnowledgeChunk_content_tsv_idx" ON "KnowledgeChunk" USING GIN (to_tsvector('english', "content"));
CREATE INDEX "KnowledgeChunk_embedding_ivfflat_idx"
  ON "KnowledgeChunk" USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE "KnowledgeChunk"
ADD CONSTRAINT "KnowledgeChunk_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
