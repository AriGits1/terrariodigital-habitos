import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Prisma 7 requires a driver adapter at runtime. Local dev uses better-sqlite3
// against the file-based database. For production, swap this adapter for the
// PostgreSQL one and read the URL from process.env.
const adapter = new PrismaBetterSqlite3({ url: "file:./prisma/dev.db" });

// Reuse a single PrismaClient across hot reloads in development so we don't
// exhaust connections (Next.js re-evaluates modules on every change).
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
