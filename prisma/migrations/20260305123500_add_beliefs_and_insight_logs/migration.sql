-- CreateEnum
CREATE TYPE "BeliefType" AS ENUM ('BELIEF', 'ASSUMPTION', 'GOAL', 'POSITION');

-- CreateEnum
CREATE TYPE "BeliefStatus" AS ENUM ('ACTIVE', 'DISMISSED');

-- CreateTable
CREATE TABLE "UserBelief" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "belief" TEXT NOT NULL,
    "beliefKey" VARCHAR(200) NOT NULL,
    "type" "BeliefType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "sourceMessageId" TEXT,
    "status" "BeliefStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBelief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsightExtractionLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sourceMessageId" TEXT,
    "inputText" TEXT NOT NULL,
    "model" VARCHAR(80),
    "extractorVersion" VARCHAR(40) NOT NULL,
    "extraction" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InsightExtractionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserBelief_userId_updatedAt_idx" ON "UserBelief"("userId", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "UserBelief_sourceMessageId_idx" ON "UserBelief"("sourceMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBelief_userId_type_beliefKey_key" ON "UserBelief"("userId", "type", "beliefKey");

-- CreateIndex
CREATE INDEX "InsightExtractionLog_userId_createdAt_idx" ON "InsightExtractionLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InsightExtractionLog_sessionId_createdAt_idx" ON "InsightExtractionLog"("sessionId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "InsightExtractionLog_sourceMessageId_idx" ON "InsightExtractionLog"("sourceMessageId");

-- AddForeignKey
ALTER TABLE "UserBelief" ADD CONSTRAINT "UserBelief_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBelief" ADD CONSTRAINT "UserBelief_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightExtractionLog" ADD CONSTRAINT "InsightExtractionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightExtractionLog" ADD CONSTRAINT "InsightExtractionLog_sourceMessageId_fkey" FOREIGN KEY ("sourceMessageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
