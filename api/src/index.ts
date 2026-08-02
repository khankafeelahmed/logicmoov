import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { logger } from "./lib/logger";
import { initRealtime } from "./realtime";

async function main() {
  const app = createApp();
  const server = createServer(app);
  initRealtime(server);

  server.listen(env.port, () => {
    logger.info(`TAXIMOVQC API listening on http://localhost:${env.port}`);
    logger.info(`Environment: ${env.nodeEnv}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down…`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  logger.error("Fatal startup error", err);
  process.exit(1);
});
