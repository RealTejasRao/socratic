-- Align KnowledgeChunk embedding column type with current database shape
-- Non-destructive type relaxation from vector(3072) -> vector
ALTER TABLE "KnowledgeChunk"
ALTER COLUMN "embedding" TYPE vector;
