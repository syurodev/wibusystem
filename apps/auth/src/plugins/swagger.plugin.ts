/**
 * @file Cấu hình plugin @elysiajs/swagger.
 * @author Your Name
 */
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
// import { env } from "@/configs";

/**
 * Plugin Swagger cấu hình cho auth-service
 * Tạo API documentation tự động
 */
export const swaggerPlugin = new Elysia().use(
  swagger({
    documentation: {
      info: {
        title: "Auth Service API",
        version: "1.0.0",
        description: "API documentation for Authentication Service",
        contact: {
          name: "DevTeam",
          email: "dev@example.com",
        },
      },
      tags: [
        {
          name: "auth",
          description: "Authentication operations",
        },
        {
          name: "users",
          description: "User management operations",
        },
        {
          name: "sessions",
          description: "Session management operations",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
    // Cấu hình path cho trang Swagger UI
    path: "/docs",
  })
);
