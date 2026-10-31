import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";

// Ensure SQLite database URL always resolves accurately regardless of process cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultDbPath = path.resolve(__dirname, "../prisma/dev.db");

if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL === "file:./dev.db" ||
  process.env.DATABASE_URL === "file:./prisma/dev.db" ||
  process.env.DATABASE_URL === "file:./apps/server/dev.db"
) {
  process.env.DATABASE_URL = `file:${defaultDbPath}`;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
