CREATE INDEX "ChatSession_userId_lastActivityAt_idx"
ON "ChatSession" ("userId", "lastActivityAt" DESC);
