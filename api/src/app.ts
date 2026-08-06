import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import apiRoutes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan("dev"));

  app.get("/health", async (_req, res) => {
    const time = new Date().toISOString();
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: "ok",
        service: "taximovqc-api",
        checks: { api: "ok", database: "ok" },
        time,
      });
    } catch (error) {
      res.status(503).json({
        status: "degraded",
        service: "taximovqc-api",
        checks: { api: "ok", database: "down" },
        error: error instanceof Error ? error.message : "Database unavailable",
        time,
      });
    }
  });

  app.use("/api/v1", apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
