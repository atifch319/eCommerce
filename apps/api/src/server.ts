import { createServer, type Server } from "node:http";
import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

start();

function start(): void {
  let config: ReturnType<typeof loadEnv>;

  try {
    config = loadEnv();
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Invalid environment configuration.",
    );
    process.exit(1);
  }

  const server = createServer(createApp());
  let isShuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}. Stopping new connections.`);

    const timer = setTimeout(() => {
      console.error("Shutdown timed out before open connections closed.");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    timer.unref();

    server.close((closeError) => {
      clearTimeout(timer);

      if (closeError) {
        console.error("The HTTP server closed with an error.");
        process.exit(1);
      }

      console.log("HTTP server closed.");
      process.exit(0);
    });

    closeIdleConnections(server);
  };

  process.on("SIGINT", () => {
    shutdown("SIGINT");
  });
  process.on("SIGTERM", () => {
    shutdown("SIGTERM");
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${config.port} is already in use.`);
    } else {
      console.error("The HTTP server failed to start.");
    }
    process.exit(1);
  });

  server.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
}

function closeIdleConnections(server: Server): void {
  if (typeof server.closeIdleConnections === "function") {
    server.closeIdleConnections();
  }
}
