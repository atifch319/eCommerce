import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadDotenv } from "dotenv";

const DEFAULT_PORT = 4000;
const NODE_ENVIRONMENTS = ["development", "test", "production"] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export type AppConfig = {
  port: number;
  nodeEnv: NodeEnvironment;
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

  if (errors.length > 0) {
    throw new EnvironmentConfigError(
      `Invalid environment configuration:\n${errors.map((item) => `- ${item}`).join("\n")}`,
    );
  }

  return { port, nodeEnv };
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
