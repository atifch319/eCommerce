import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

loadDotenv({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".env"),
  quiet: true,
});

const databaseUrl = process.env.DATABASE_URL;

if (!isPostgresUrl(databaseUrl)) {
  throw new Error(
    "DATABASE_URL must be set to a PostgreSQL connection URL before running Prisma.",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});

function isPostgresUrl(value: string | undefined): value is string {
  if (value === undefined || value.trim() === "") {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "postgresql:" || url.protocol === "postgres:";
  } catch {
    return false;
  }
}
