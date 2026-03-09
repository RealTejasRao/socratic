import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

function extractPromptVersion(model) {
  if (!model) return "unknown";
  const match = model.match(/\(([^()]+)\)\s*$/);
  return match?.[1]?.trim() ?? "unknown";
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function asFlagArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string");
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

try {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const messages = await prisma.message.findMany({
    where: {
      role: "ASSISTANT",
      createdAt: { gte: cutoff },
    },
    select: {
      createdAt: true,
      model: true,
      validationScore: true,
      validationFlags: true,
      latencyMs: true,
      tokenIn: true,
      tokenOut: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const scoreValues = messages
    .map((m) => m.validationScore)
    .filter((v) => typeof v === "number");
  const latencyValues = messages
    .map((m) => m.latencyMs)
    .filter((v) => typeof v === "number");
  const tokenInValues = messages
    .map((m) => m.tokenIn)
    .filter((v) => typeof v === "number");
  const tokenOutValues = messages
    .map((m) => m.tokenOut)
    .filter((v) => typeof v === "number");

  const flagCounts = new Map();
  for (const message of messages) {
    for (const flag of asFlagArray(message.validationFlags)) {
      flagCounts.set(flag, (flagCounts.get(flag) ?? 0) + 1);
    }
  }

  const byVersion = new Map();
  for (const message of messages) {
    const version = extractPromptVersion(message.model);
    const bucket = byVersion.get(version) ?? { count: 0, scores: [] };
    bucket.count += 1;
    if (typeof message.validationScore === "number") {
      bucket.scores.push(message.validationScore);
    }
    byVersion.set(version, bucket);
  }

  console.log("AI Weekly Report (last 7 days)");
  console.log("--------------------------------");
  console.log(`Responses: ${messages.length}`);
  console.log(`Avg validation score: ${average(scoreValues)?.toFixed(2) ?? "n/a"}`);
  console.log(`Avg latency (ms): ${average(latencyValues)?.toFixed(2) ?? "n/a"}`);
  console.log(`Avg tokenIn: ${average(tokenInValues)?.toFixed(2) ?? "n/a"}`);
  console.log(`Avg tokenOut: ${average(tokenOutValues)?.toFixed(2) ?? "n/a"}`);

  const sortedFlags = [...flagCounts.entries()].sort((a, b) => b[1] - a[1]);
  console.log("\nTop flags:");
  if (!sortedFlags.length) {
    console.log("- none");
  } else {
    for (const [flag, count] of sortedFlags.slice(0, 10)) {
      console.log(`- ${flag}: ${count}`);
    }
  }

  const sortedVersions = [...byVersion.entries()].sort((a, b) => b[1].count - a[1].count);
  console.log("\nBy prompt version:");
  if (!sortedVersions.length) {
    console.log("- none");
  } else {
    for (const [version, bucket] of sortedVersions) {
      console.log(
        `- ${version}: count=${bucket.count}, avgScore=${average(bucket.scores)?.toFixed(2) ?? "n/a"}`,
      );
    }
  }
} finally {
  await prisma.$disconnect();
  await pool.end();
}
