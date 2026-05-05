import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/** Needed for `prisma generate` / migrate when `.env` is missing `DATABASE_URL` locally. */
const datasourceUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: { path: path.join("prisma", "migrations") },
  datasource: { url: datasourceUrl },
});
