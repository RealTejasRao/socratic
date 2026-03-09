-- AlterTable
ALTER TABLE "Message"
ADD COLUMN "validationVersion" VARCHAR(40),
ADD COLUMN "validationScore" INTEGER,
ADD COLUMN "validationFlags" JSONB,
ADD COLUMN "validationSummary" TEXT;
