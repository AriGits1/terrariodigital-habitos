import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL out of the schema and into this config.
// IMPORTANT: with a prisma.config.ts present, Prisma no longer auto-loads .env,
// so we load it ourselves here. Without this, `prisma migrate` fails with
// "Connection url is empty". (process.loadEnvFile exists on Node 20.12+.)
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file (e.g. CI/prod where DATABASE_URL is already injected) — ignore.
  }
}

// The database is PostgreSQL; DATABASE_URL comes from .env (local dev runs
// Postgres via docker-compose.yml) or the deployment environment.
// Note: `prisma generate` does not need a live URL, so we do not throw here —
// commands that actually connect (migrate, db push) surface a clear error if
// DATABASE_URL is missing.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
