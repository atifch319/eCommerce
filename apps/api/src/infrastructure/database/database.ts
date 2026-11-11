import { AppError } from "../../common/errors/app-error.js";
import type { PrismaClient } from "../../generated/prisma/client.js";
import { logger } from "../logging/logger.js";
import { createPrismaClient } from "./prisma-client.js";

export type Database = {
  readonly client: PrismaClient;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  check(): Promise<void>;
};

export function createDatabase(databaseUrl: string): Database {
  const client = createPrismaClient(databaseUrl);
  let disconnecting: Promise<void> | undefined;

  return {
    client,

    async connect(): Promise<void> {
      try {
        await client.$connect();
        await client.$queryRaw`SELECT 1`;
      } catch (error) {
        logger.error(error);
        throw new Error("Database connection failed.", { cause: error });
      }
    },

    async check(): Promise<void> {
      try {
        await client.$queryRaw`SELECT 1`;
      } catch (error) {
        logger.error(error);
        throw new AppError({
          statusCode: 503,
          code: "DATABASE_UNAVAILABLE",
          message: "Database is unavailable",
        });
      }
    },

    disconnect(): Promise<void> {
      disconnecting ??= client.$disconnect().then(() => undefined);
      return disconnecting;
    },
  };
}
