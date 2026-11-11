import { AppError } from "../../common/errors/app-error.js";
import { Prisma } from "../../generated/prisma/client.js";
import { logger } from "../logging/logger.js";

const CONNECTION_ERROR_CODES = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1017",
  "P2024",
]);

const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

export function throwMappedDatabaseError(error: unknown): never {
  const mapped = mapDatabaseError(error);
  if (!mapped) {
    throw error;
  }

  logger.error(error);
  throw mapped;
}

function mapDatabaseError(error: unknown): AppError | undefined {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (CONNECTION_ERROR_CODES.has(error.code)) {
      return unavailable();
    }

    if (error.code === "P2002") {
      return new AppError({
        statusCode: 409,
        code: "CONFLICT",
        message: "Example already exists",
      });
    }

    if (error.code === "P2025") {
      return new AppError({
        statusCode: 404,
        code: "RESOURCE_NOT_FOUND",
        message: "Example not found",
      });
    }

    return undefined;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return unavailable();
  }

  if (isNetworkError(error)) {
    return unavailable();
  }

  return undefined;
}

function unavailable(): AppError {
  return new AppError({
    statusCode: 503,
    code: "DATABASE_UNAVAILABLE",
    message: "Database is unavailable",
  });
}

function isNetworkError(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  return typeof error.code === "string" && NETWORK_ERROR_CODES.has(error.code);
}
