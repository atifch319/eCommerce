import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { healthRouter } from "./routes/health.routes.js";

type ErrorResponse = {
  success: false;
  message: string;
};

type JsonParseError = SyntaxError & {
  status?: number;
  type?: string;
};

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());
  app.use("/api/health", healthRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

function notFoundHandler(_request: Request, response: Response): void {
  const body: ErrorResponse = {
    success: false,
    message: "Route not found",
  };

  response.status(404).json(body);
}

function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (isJsonParseError(error)) {
    const body: ErrorResponse = {
      success: false,
      message: "Request body must be valid JSON.",
    };
    response.status(400).json(body);
    return;
  }

  console.error("Unhandled API error.");
  if (error instanceof Error && error.message) {
    console.error(error.message);
  }

  const body: ErrorResponse = {
    success: false,
    message: "Internal server error",
  };
  response.status(500).json(body);
}

function isJsonParseError(error: unknown): error is JsonParseError {
  if (!(error instanceof SyntaxError)) {
    return false;
  }

  const parseError = error as JsonParseError;
  return parseError.status === 400 && parseError.type === "entity.parse.failed";
}
