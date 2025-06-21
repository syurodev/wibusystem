import { Elysia } from "elysia";
import { SERVICE_CONFIG } from "./configs";
import { ProxyMiddleware } from "./middleware/proxy.middleware";
import { ProxyService } from "./services/proxy.service";

// Khởi tạo services
const proxyMiddleware = new ProxyMiddleware();
const proxyService = new ProxyService();

const app = new Elysia()
  // Health check endpoint
  .get("/health", () => ({
    status: "healthy",
    service: SERVICE_CONFIG.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }))

  // Gateway info endpoint
  .get("/gateway/info", () => ({
    service: SERVICE_CONFIG.SERVICE_NAME,
    version: "1.0.0",
    description: "Reverse proxy gateway for microservices",
    availableServices: proxyService.getAvailableServices(),
    usage: {
      header: "x-project-id",
      description:
        "Include x-project-id header to route your request to the appropriate service",
      examples: {
        "3101": "Auth Service",
        "3102": "Novel Service",
      },
    },
  }))

  // Proxy routes - Handle tất cả HTTP methods và paths
  .all("/*", async (ctx) => {
    // Skip proxy cho các route đặc biệt
    const path = new URL(ctx.request.url).pathname;
    if (path.startsWith("/health") || path.startsWith("/gateway/")) {
      return new Response("Not Found", { status: 404 });
    }

    return await proxyMiddleware.handleProxy(ctx);
  })

  .listen(SERVICE_CONFIG.SERVICE_PORT);

console.log(
  `🦊 Elysia ${SERVICE_CONFIG.SERVICE_NAME} service is running at http://${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📋 Gateway info: http://${app.server?.hostname}:${app.server?.port}/gateway/info`
);
console.log(
  `❤️  Health check: http://${app.server?.hostname}:${app.server?.port}/health`
);
console.log(`🔄 Available services:`);
proxyService.getAvailableServices().forEach((service) => {
  console.log(
    `   - ${service.name} (project-id: ${service.projectId}) -> ${service.endpoint}`
  );
});
