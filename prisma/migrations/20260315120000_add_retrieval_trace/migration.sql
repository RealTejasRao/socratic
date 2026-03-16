CREATE TABLE "RetrievalTrace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "rawUserQuery" TEXT NOT NULL,
    "retrievalQuery" TEXT NOT NULL,
    "vectorCandidates" JSONB,
    "lexicalCandidates" JSONB,
    "fusedCandidates" JSONB,
    "rerankedCandidates" JSONB,
    "selectedPassages" JSONB,
    "retrievalLatencyMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetrievalTrace_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RetrievalTrace_userId_createdAt_idx"
  ON "RetrievalTrace"("userId", "createdAt" DESC);
CREATE INDEX "RetrievalTrace_sessionId_createdAt_idx"
  ON "RetrievalTrace"("sessionId", "createdAt" DESC);
CREATE INDEX "RetrievalTrace_sourceMessageId_idx"
  ON "RetrievalTrace"("sourceMessageId");

ALTER TABLE "RetrievalTrace"
ADD CONSTRAINT "RetrievalTrace_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RetrievalTrace"
ADD CONSTRAINT "RetrievalTrace_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RetrievalTrace"
ADD CONSTRAINT "RetrievalTrace_sourceMessageId_fkey"
FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
