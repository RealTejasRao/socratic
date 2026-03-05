-- CreateTable
CREATE TABLE "ConversationMemorySnapshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "coveredUntilMessageId" TEXT,
    "totalMessages" INTEGER NOT NULL,
    "version" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMemorySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationMemorySnapshot_sessionId_createdAt_idx"
ON "ConversationMemorySnapshot"("sessionId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ConversationMemorySnapshot"
ADD CONSTRAINT "ConversationMemorySnapshot_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
