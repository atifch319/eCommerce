import type { NextFunction, Request, Response } from "express";
import { AppError, type ApiErrorResponse } from "../errors/app-error.js";
import { logger } from "../../infrastructure/logging/logger.js";

const JSON_BODY_LIMIT_LABEL = "1 MB";

type BodyParserError = {
  status?: number;
  statusCode?: number;
  type?: string;
};

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    sendError(
      response,
      error.statusCode,
      error.code,
      error.message,
      error.details,
    );
    return;
  }

  if (isJsonParseError(error)) {
    sendError(
      response,
      400,
      "INVALID_JSON",
      "Request body must be valid JSON.",
    );
    return;
  }

  if (isPayloadTooLarge(error)) {
    sendError(
      response,
      413,
      "PAYLOAD_TOO_LARGE",
      `Request body exceeds the ${JSON_BODY_LIMIT_LABEL} limit.`,
    );
    return;
  }

  logger.error(error);
  sendError(response, 500, "INTERNAL_ERROR", "Internal server error");
}

function sendError(
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: ApiErrorResponse["error"]["details"],
): void {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message },
  };

  if (details && details.length > 0) {
    body.error.details = details;
  }

  response.status(statusCode).json(body);
}

function isJsonParseError(error: unknown): boolean {
  const parserError = asBodyParserError(error);
  if (parserError?.type === "entity.parse.failed") {
    return true;
  }

  return error instanceof SyntaxError && parserError?.status === 400;
}

function isPayloadTooLarge(error: unknown): boolean {
  const parserError = asBodyParserError(error);
  const status = parserError?.status ?? parserError?.statusCode;
  return parserError?.type === "entity.too.large" || status === 413;
}

function asBodyParserError(error: unknown): BodyParserError | undefined {
  if (typeof error !== "object" || error === null) {
    return undefined;
  }

  return error as BodyParserError;
}
