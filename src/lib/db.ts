import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter at runtime. The database is PostgreSQL;
// the connection string comes from DATABASE_URL (local dev runs Postgres via
// docker-compose.yml).
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — cannot connect to PostgreSQL.");
}
const adapter = new PrismaPg({ connectionString });

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
