import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { config as loadEnv } from "dotenv";
import OpenAI from "openai";
import { decode, encode } from "gpt-tokenizer";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

loadEnv({ path: ".env.local" });

const CHUNK_TOKENS = 400;
const CHUNK_OVERLAP_TOKENS = 100;
const EMBEDDING_BATCH_SIZE = 32;
const EMBEDDING_MODEL =
  process.env.OPENAI_EMBED_MODEL ?? "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 1536;
const CHUNK_TYPE_TEXT = "text";

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

function cleanChunkText(text) {
  return text.replace(/\s+/g, " ").trim();
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

function chunkDocumentByTokens(params) {
  const allTokens = encode(params.text);
  if (!allTokens.length) return [];

  const step = Math.max(1, CHUNK_TOKENS - CHUNK_OVERLAP_TOKENS);
  const chunks = [];

  for (let start = 0; start < allTokens.length; start += step) {
    const end = Math.min(allTokens.length, start + CHUNK_TOKENS);
    const tokenSlice = allTokens.slice(start, end);
    if (!tokenSlice.length) continue;

    const content = cleanChunkText(decode(tokenSlice));
    if (content) {
      chunks.push({
        content,
        chunkIndex: chunks.length,
        author: params.author,
        title: params.title,
        tokenCount: tokenSlice.length,
        chunkType: CHUNK_TYPE_TEXT,
      });
    }

    if (end >= allTokens.length) break;
  }

  return chunks;
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
    dimensions: EMBEDDING_DIMENSIONS,
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

  for (
    let start = 0;
    start < params.chunks.length;
    start += EMBEDDING_BATCH_SIZE
  ) {
    const batch = params.chunks.slice(start, start + EMBEDDING_BATCH_SIZE);
    const embeddings = await embedTexts(batch.map((item) => item.content));

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
        chunk.chunkType,
        chunk.content,
        chunk.tokenCount,
        vectorLiteral,
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}::halfvec)`;
    });

    if (valueRows.length) {
      const query = `
        INSERT INTO "KnowledgeChunk" ("id", "documentId", "chunkIndex", "chunkType", "content", "tokenCount", "embedding")
        VALUES ${valueRows.join(",\n")}
      `;
      await pool.query(query, values);
    }

    const done = Math.min(start + EMBEDDING_BATCH_SIZE, params.chunks.length);
    console.log(`    embedded/inserted ${done}/${params.chunks.length}`);
  }
}

async function collectCorpusFiles(rootDir) {
  const booksDirPath = path.join(rootDir, "books");
  const entries = await fs.readdir(booksDirPath, { withFileTypes: true });

  return entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"),
    )
    .map((entry) => ({
      dirName: "books",
      fullPath: path.join(booksDirPath, entry.name),
      filename: entry.name,
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}

async function ingestBooks() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const repoRoot = path.resolve(__dirname, "..");
  const files = await collectCorpusFiles(repoRoot);

  if (!files.length) {
    console.log("No .txt files found in /books.");
    return;
  }

  console.log(`Found ${files.length} corpus files.`);
  console.log(
    `Chunking: ${CHUNK_TOKENS} tokens, overlap: ${CHUNK_OVERLAP_TOKENS}`,
  );
  console.log(`Embedding model: ${EMBEDDING_MODEL}`);
  console.log(`Embedding dimensions: ${EMBEDDING_DIMENSIONS}`);

  let skippedCount = 0;
  let reindexedCount = 0;

  for (const file of files) {
    const content = await fs.readFile(file.fullPath, "utf8");
    const { author, title } = parseAuthorTitleFromFilename(file.filename);
    const sourcePath = `${file.dirName}/${file.filename}`;
    const contentHash = computeContentHash(content);
    const chunks = chunkDocumentByTokens({ text: content, author, title });

    console.log(`\nIngesting: ${author} - ${title}`);
    console.log(`  type: ${CHUNK_TYPE_TEXT}`);
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
      existingDoc.sourcePath === sourcePath &&
      existingDoc._count.chunks > 0
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
      console.log(
        "  skipped (backfilled missing hash, no re-embedding needed)",
      );
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
