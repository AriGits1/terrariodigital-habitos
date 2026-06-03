import { defineConfig } from "prisma/config";

// Prisma 7 moved the connection URL out of the schema and into this config.
// Local dev uses a file-based SQLite database (the path is not a secret).
// For production, read this from process.env and point it at PostgreSQL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "file:./prisma/dev.db",
  },
});
