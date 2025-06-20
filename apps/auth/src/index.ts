import {
  allErrorHandler,
  COLOR_SCHEMES,
  createLogger,
  createLoggerPlugin,
} from "@repo/elysia-common";
import { Elysia } from "elysia";

import swagger from "@elysiajs/swagger";
import { createSuccessResponse, HTTP_STATUS } from "@repo/utils";
import { SERVICE_CONFIG } from "./configs";
import { testDatabaseConnection } from "./database";
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
  .onError(({ code, error, log, set }) => {
    console.log(code, error, log);
    set.status = HTTP_STATUS.OK;
    return allErrorHandler(code, error, log);
  })
  .use(
    new Elysia()
      .mapResponse(({ response, set, path }) => {
        // Bỏ qua Swagger routes
        if (path.startsWith("/docs") || path.startsWith("/swagger")) {
          return; // Return undefined để Elysia xử lý response như bình thường
        }

        // Chỉ wrap response nếu chưa phải là ApiResponse format
        if (
          response &&
          typeof response === "object" &&
          !("status" in response && "status_code" in response)
        ) {
          const apiResponse = createSuccessResponse(response, "Success");

          // mapResponse cần return Web Standard Response
          return new Response(JSON.stringify(apiResponse), {
            status: apiResponse.status_code,
            headers: {
              "Content-Type": "application/json",
              ...(set.headers as Record<string, string>),
            },
          });
        }

        // Return undefined để Elysia xử lý response như bình thường
        return;
      })
      .use(apiRoutes)
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Auth Service",
          version: "1.0.0",
          description: "API Documentation for Auth Service",
        },
        servers: [
          {
            url: "http://localhost:3101",
            description: "Development server",
          },
        ],
        tags: [
          {
            name: "Auth",
            description: "Authentication API endpoints",
          },
        ],
      },
    })
  )
  .listen(SERVICE_CONFIG.SERVICE_PORT);

const startupLogger = createLogger({
  service: "auth-service",
  environment: SERVICE_CONFIG.NODE_ENV,
  colorize: true,
});

// Test database connection on startup
testDatabaseConnection()
  .then((connected) => {
    if (connected) {
      startupLogger.info("✅ Database connection successful");
    } else {
      startupLogger.error("❌ Database connection failed");
    }
  })
  .catch((error) => {
    startupLogger.error("❌ Database connection error:", error);
  });

startupLogger.info(
  `🦊 Elysia Auth Service is running at ${app.server?.hostname}:${app.server?.port}`
);
