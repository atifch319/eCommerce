import morgan from "morgan";
import type { NodeEnvironment } from "../config/env.js";

export function requestLogger(nodeEnv: NodeEnvironment) {
  // "dev" and "combined" record the request line, status, and timing.
  // They do not record bodies or the Authorization header.
  return morgan(nodeEnv === "production" ? "combined" : "dev");
}
