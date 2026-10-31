import { Router } from "express";
import type { HealthResponse } from "../types/health.types.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  const body: HealthResponse = {
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  };

  response.status(200).json(body);
});
