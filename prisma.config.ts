import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL out of the schema and into this config.
// The database is PostgreSQL; DATABASE_URL is provided by .env (local dev runs
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
