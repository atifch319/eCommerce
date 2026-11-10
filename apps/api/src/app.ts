import express from "express";
import type { AppConfig } from "./config/env.js";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";
import { requestLogger } from "./middleware/request-logger.middleware.js";
import { exampleValidationRouter } from "./routes/example-validation.routes.js";
import { healthRouter } from "./routes/health.routes.js";

export const JSON_BODY_LIMIT = "1mb";

export function createApp(config: AppConfig) {
  const app = express();

  app.disable("x-powered-by");

  // next() with no argument continues to the next middleware.
  // next(error) or a thrown error skips to the error handler.
  // Express 5 also forwards a rejected promise from an async route.
  app.use(corsMiddleware(config.frontendOrigin));
  app.use(requestLogger(config.nodeEnv));
  app.use(express.json({ limit: JSON_BODY_LIMIT }));
  app.use("/api/health", healthRouter);
  app.use("/api/examples", exampleValidationRouter);
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
