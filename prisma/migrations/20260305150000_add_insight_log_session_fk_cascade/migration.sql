-- Ensure InsightExtractionLog is removed when a chat session is deleted
ALTER TABLE "InsightExtractionLog"
ADD CONSTRAINT "InsightExtractionLog_sessionId_fkey"
FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
