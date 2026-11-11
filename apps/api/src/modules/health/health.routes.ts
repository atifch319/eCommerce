import { Router } from "express";
import type { DatabaseHealthResponse, HealthResponse } from "./health.types.js";

export function createHealthRouter(checkDatabase: () => Promise<void>): Router {
  const router = Router();

  router.get("/", (_request, response) => {
    const body: HealthResponse = {
      success: true,
      message: "API is healthy",
      timestamp: new Date().toISOString(),
    };

    response.status(200).json(body);
  });

  router.get("/database", (_request, response, next) => {
    checkDatabase()
      .then(() => {
        const body: DatabaseHealthResponse = {
          success: true,
          message: "Database is reachable",
        };
        response.status(200).json(body);
      })
      .catch(next);
  });

  return router;
}
