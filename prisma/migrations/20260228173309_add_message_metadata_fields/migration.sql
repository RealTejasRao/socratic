-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "latencyMs" INTEGER,
ADD COLUMN     "model" VARCHAR(80),
ADD COLUMN     "tokenIn" INTEGER,
ADD COLUMN     "tokenOut" INTEGER;
