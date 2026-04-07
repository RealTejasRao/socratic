CREATE TABLE IF NOT EXISTS "EarlyAccess" (
  "id" TEXT NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EarlyAccess_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "EarlyAccess_email_key" ON "EarlyAccess"("email");
CREATE INDEX IF NOT EXISTS "EarlyAccess_createdAt_idx" ON "EarlyAccess"("createdAt" DESC);
