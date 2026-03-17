import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

loadEnv({ path: ".env.local" });

const CHUNK_TOKENS = 700;
const CHUNK_OVERLAP_TOKENS = 120;
const EMBEDDING_BATCH_SIZE = 32;
const EMBEDDING_MODEL = process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-small";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function tokenizeForChunking(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

function chunkTextByTokens(text, chunkTokens = CHUNK_TOKENS, overlapTokens = CHUNK_OVERLAP_TOKENS) {
  const words = tokenizeForChunking(text);
  if (!words.length) return [];

  const chunks = [];
  const step = Math.max(1, chunkTokens - overlapTokens);

  for (let start = 0; start < words.length; start += step) {
    const end = Math.min(words.length, start + chunkTokens);
    const slice = words.slice(start, end);
    if (!slice.length) continue;
    chunks.push({
      text: slice.join(" "),
      tokenCount: slice.length,
    });
    if (end >= words.length) break;
  }

  return chunks;
}

function parseAuthorTitleFromFilename(filename) {
  const withoutExt = filename.replace(/\.txt$/i, "");
  const [authorRaw, ...titleParts] = withoutExt.split("-");
  const titleRaw = titleParts.join("-");

  const author = (authorRaw || "Unknown")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const title = (titleRaw || withoutExt)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { author, title };
}

function computeContentHash(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function toVectorLiteral(embedding) {
  return `[${embedding.join(",")}]`;
}

async function embedTexts(texts) {
  if (!texts.length) return [];
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((item) => item.embedding);
}

async function findExistingBookDocument(params) {
  return prisma.knowledgeDocument.findUnique({
    where: {
      author_title: {
        author: params.author,
        title: params.title,
      },
    },
    select: {
      id: true,
      contentHash: true,
      sourcePath: true,
      _count: {
        select: {
          chunks: true,
        },
      },
    },
  });
}

async function upsertBookDocument(params) {
  return prisma.knowledgeDocument.upsert({
    where: {
      author_title: {
        author: params.author,
        title: params.title,
      },
    },
    update: {
      sourcePath: params.sourcePath,
      contentHash: params.contentHash,
      isActive: true,
    },
    create: {
      author: params.author,
      title: params.title,
      sourcePath: params.sourcePath,
      contentHash: params.contentHash,
      isActive: true,
    },
    select: {
      id: true,
      contentHash: true,
    },
  });
}

async function replaceDocumentChunks(params) {
  await prisma.knowledgeChunk.deleteMany({
    where: { documentId: params.documentId },
  });

  for (let start = 0; start < params.chunks.length; start += EMBEDDING_BATCH_SIZE) {
    const batch = params.chunks.slice(start, start + EMBEDDING_BATCH_SIZE);
    const embeddings = await embedTexts(batch.map((item) => item.text));

    const values = [];
    const valueRows = batch.map((chunk, idx) => {
      const embedding = embeddings[idx];
      if (!embedding) {
        throw new Error(`Missing embedding for chunk ${chunk.chunkIndex}`);
      }

      const vectorLiteral = toVectorLiteral(embedding);
      const offset = values.length;
      values.push(
        randomUUID(),
        params.documentId,
        chunk.chunkIndex,
        chunk.text,
        chunk.tokenCount,
        vectorLiteral,
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}::vector)`;
    });

    if (valueRows.length) {
      const query = `
        INSERT INTO "KnowledgeChunk" ("id", "documentId", "chunkIndex", "content", "tokenCount", "embedding")
        VALUES ${valueRows.join(",\n")}
      `;
      await pool.query(query, values);
    }

    const done = Math.min(start + EMBEDDING_BATCH_SIZE, params.chunks.length);
    console.log(`    embedded/inserted ${done}/${params.chunks.length}`);
  }
}

async function ingestBooks() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..");
  const booksDir = path.join(repoRoot, "books");

  const allEntries = await fs.readdir(booksDir, { withFileTypes: true });
  const files = allEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (!files.length) {
    console.log("No .txt files found in /books.");
    return;
  }

  console.log(`Found ${files.length} book files.`);
  console.log(`Chunking: ${CHUNK_TOKENS} tokens, overlap: ${CHUNK_OVERLAP_TOKENS}`);
  console.log(`Embedding model: ${EMBEDDING_MODEL}`);

  let skippedCount = 0;
  let reindexedCount = 0;

  for (const filename of files) {
    const fullPath = path.join(booksDir, filename);
    const content = await fs.readFile(fullPath, "utf8");
    const { author, title } = parseAuthorTitleFromFilename(filename);
    const sourcePath = `books/${filename}`;
    const contentHash = computeContentHash(content);
    const chunks = chunkTextByTokens(content).map((item, index) => ({
      chunkIndex: index,
      text: item.text,
      tokenCount: item.tokenCount,
    }));

    console.log(`\nIngesting: ${author} - ${title}`);
    console.log(`  chunks: ${chunks.length}`);

    if (!chunks.length) {
      console.log("  skipped (empty text after normalization)");
      continue;
    }

    const existingDoc = await findExistingBookDocument({
      author,
      title,
    });

    if (
      existingDoc &&
      existingDoc.contentHash === contentHash &&
      existingDoc.sourcePath === sourcePath
    ) {
      skippedCount += 1;
      console.log("  skipped (unchanged, no new embeddings needed)");
      continue;
    }

    if (
      existingDoc &&
      existingDoc.contentHash === null &&
      existingDoc.sourcePath === sourcePath &&
      existingDoc._count.chunks > 0
    ) {
      await prisma.knowledgeDocument.update({
        where: { id: existingDoc.id },
        data: { contentHash },
      });
      skippedCount += 1;
      console.log("  skipped (backfilled missing hash, no re-embedding needed)");
      continue;
    }

    const doc = await upsertBookDocument({
      author,
      title,
      sourcePath,
      contentHash,
    });

    await replaceDocumentChunks({
      documentId: doc.id,
      chunks,
    });
    reindexedCount += 1;
  }

  const documentCount = await prisma.knowledgeDocument.count();
  const chunkCount = await prisma.knowledgeChunk.count();
  console.log("\nDone.");
  console.log(`KnowledgeDocument: ${documentCount}`);
  console.log(`KnowledgeChunk: ${chunkCount}`);
  console.log(`Reindexed this run: ${reindexedCount}`);
  console.log(`Skipped unchanged: ${skippedCount}`);
}

try {
  await ingestBooks();
} finally {
  await prisma.$disconnect();
  await pool.end();
}
