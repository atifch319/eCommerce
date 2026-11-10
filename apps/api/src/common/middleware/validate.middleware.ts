import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError, type FieldErrorDetail } from "../errors/app-error.js";
import "../types/express-locals.js";

type RequestPart = "body" | "query" | "params";

type ValidationSchemas = Partial<Record<RequestPart, ZodType>>;

type ZodIssueLike = {
  path: PropertyKey[];
  message: string;
};

export function validate(schemas: ValidationSchemas) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const details: FieldErrorDetail[] = [];
    const parsed: NonNullable<Response["locals"]["validatedInput"]> = {};

    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) {
        continue;
      }

      const result = schema.safeParse(request[part]);
      if (!result.success) {
        details.push(...formatIssues(part, result.error.issues));
        continue;
      }

      parsed[part] = result.data;
    }

    if (details.length > 0) {
      next(
        new AppError({
          statusCode: 400,
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details,
        }),
      );
      return;
    }

    response.locals.validatedInput = {
      ...response.locals.validatedInput,
      ...parsed,
    };
    next();
  };
}

function formatIssues(
  part: RequestPart,
  issues: ZodIssueLike[],
): FieldErrorDetail[] {
  return issues.map((issue) => {
    const field = issue.path.map((segment) => String(segment)).join(".");
    return {
      path: field.length > 0 ? `${part}.${field}` : part,
      message: issue.message,
    };
  });
}
