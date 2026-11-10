import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const DEFAULT_PORT = 4000;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";
const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export type AppConfig = {
  port: number;
  nodeEnv: NodeEnvironment;
  frontendOrigin: string;
};

export class EnvironmentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigError";
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppConfig {
  loadDotenv({ path: envFilePath(), quiet: true });

  const errors: string[] = [];
  const port = readPort(source.PORT, errors);
  const nodeEnv = readNodeEnv(source.NODE_ENV, errors);
  const frontendOrigin = readFrontendOrigin(source.FRONTEND_ORIGIN, errors);

  if (errors.length > 0) {
    throw new EnvironmentConfigError(
      `Invalid environment configuration:\n${errors.map((item) => `- ${item}`).join("\n")}`,
    );
  }

  return { port, nodeEnv, frontendOrigin };
}

function envFilePath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../.env");
}

function readPort(value: string | undefined, errors: string[]): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  if (!/^[0-9]+$/.test(value)) {
    errors.push("PORT must be a whole number from 1 to 65535.");
    return DEFAULT_PORT;
  }

  const port = Number(value);
  if (port < 1 || port > 65535) {
    errors.push("PORT must be a whole number from 1 to 65535.");
    return DEFAULT_PORT;
  }

  return port;
}

function readNodeEnv(
  value: string | undefined,
  errors: string[],
): NodeEnvironment {
  if (value === undefined) {
    return "development";
  }

  if (isNodeEnvironment(value)) {
    return value;
  }

  errors.push("NODE_ENV must be development, test, or production.");
  return "development";
}

function isNodeEnvironment(value: string): value is NodeEnvironment {
  return NODE_ENVIRONMENTS.some((environment) => environment === value);
}

function readFrontendOrigin(
  value: string | undefined,
  errors: string[],
): string {
  if (value === undefined) {
    return DEFAULT_FRONTEND_ORIGIN;
  }

  if (value.trim() === "*") {
    errors.push("FRONTEND_ORIGIN must be a specific origin, not *.");
    return DEFAULT_FRONTEND_ORIGIN;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    errors.push("FRONTEND_ORIGIN must be an absolute http or https origin.");
    return DEFAULT_FRONTEND_ORIGIN;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    errors.push("FRONTEND_ORIGIN must be an absolute http or https origin.");
    return DEFAULT_FRONTEND_ORIGIN;
  }

  if (url.username !== "" || url.password !== "") {
    errors.push("FRONTEND_ORIGIN must not include credentials.");
    return DEFAULT_FRONTEND_ORIGIN;
  }

  if (url.pathname !== "/" || url.search !== "" || url.hash !== "") {
    errors.push(
      "FRONTEND_ORIGIN must be an origin without a path, query, or hash.",
    );
    return DEFAULT_FRONTEND_ORIGIN;
  }

  return url.origin;
}
