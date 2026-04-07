import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const PRISMA_CLIENT_SCHEMA_VERSION = "early-access-v1";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaVersion: string | undefined;
};

const connectionString = process.env["DATABASE_URL"];

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const shouldReuseExistingClient =
  globalForPrisma.prisma !== undefined &&
  globalForPrisma.prismaSchemaVersion === PRISMA_CLIENT_SCHEMA_VERSION;

const prismaClient: PrismaClient = shouldReuseExistingClient
  ? globalForPrisma.prisma!
  : new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["error"],
    });

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaClient;
  globalForPrisma.prismaSchemaVersion = PRISMA_CLIENT_SCHEMA_VERSION;
}
