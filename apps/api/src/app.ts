import express from "express";
import type { AppConfig } from "./config/env.js";
import { corsMiddleware } from "./common/middleware/cors.middleware.js";
import { errorHandler } from "./common/middleware/error-handler.middleware.js";
import { notFoundMiddleware } from "./common/middleware/not-found.middleware.js";
import { requestLogger } from "./common/middleware/request-logger.middleware.js";
import { createExampleModule } from "./modules/example/example.module.js";
import { healthRouter } from "./modules/health/health.routes.js";

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
  app.use("/api/examples", createExampleModule());
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}
