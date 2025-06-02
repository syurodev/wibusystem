import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { APP_CONFIG } from "./configs/env";
import { apiRoutes } from "./modules";

const app = new Elysia()
  .get("/", () => "🔒 Auth Service - Device Registration Available")
  .get("/health", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "auth-service",
  }))
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

console.log(
  `🦊 Elysia Auth Service is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📱 Device Registration: http://${app.server?.hostname}:${app.server?.port}/device-auth/register`
);
