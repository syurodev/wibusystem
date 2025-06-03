import swagger from "@elysiajs/swagger";
import { COMMON_DATE_FORMATS, formatDateTime, now } from "@repo/common";
import {
  allErrorHandler,
  COLOR_SCHEMES,
  createLogger,
  createLoggerPlugin,
} from "@repo/elysia-common";
import { Elysia } from "elysia";

import { APP_CONFIG } from "./configs/env";
import { apiRoutes } from "./modules";

const app = new Elysia()
  .use(
    createLoggerPlugin({
      level: "debug",
      service: "auth-service",
      environment: "development",
      colorize: true,
      prettyPrint: true,
      customColors: COLOR_SCHEMES.bright,
    })
  )
  .onError(({ code, error, log }) => {
    return allErrorHandler(code, error, log);
  })
  .get("/api", ({ log }) => {
    log.info("Root endpoint accessed");
    return "🔒 Auth Service - Device Registration Available";
  })
  .get("/api/health", ({ log }) => {
    log.info("Health check requested");
    return {
      status: "healthy",
      timestamp: formatDateTime(now(), COMMON_DATE_FORMATS.DATE_TIME),
      service: "auth-service",
    };
  })
  .use(apiRoutes)
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Auth Service",
          version: "1.0.0",
        },
        tags: [
          {
            name: "Auth",
            description: "Auth API",
          },
        ],
      },
    })
  )
  .listen(APP_CONFIG.SERVICE_PORT);

// Tạo standalone logger với colors cho startup messages
const startupLogger = createLogger({
  service: "auth-service",
  environment: APP_CONFIG.NODE_ENV,
  colorize: true,
});

startupLogger.info(
  `🦊 Elysia Auth Service is running at ${app.server?.hostname}:${app.server?.port}`
);
