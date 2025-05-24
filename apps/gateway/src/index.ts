import { Elysia, type Context } from "elysia";
import { APP_CONFIG, PROXY } from "./configs";
import { createAuthMiddleware } from "./middlewares/auth.middleware";
import { proxyRequest } from "./utils/proxy.util";

const app = new Elysia();

// Middleware xử lý lỗi toàn cục
app.onError(({ code, error, set }) => {
  console.error(`[Gateway Error] ${code}:`, error);
  set.status = code === 'NOT_FOUND' ? 404 : 500;
  return {
    error: code,
    message: error instanceof Error ? error.message : 'Internal Server Error',
  };
});

// Middleware log request
app.derive((context) => {
  console.log(`[${new Date().toISOString()}] ${context.request.method} ${context.path}`);
  return {};
});

// Reverse proxy cho Auth service với middleware xác thực
app.all("/auth/*", 
  createAuthMiddleware('auth'),
  async (context: Context) => {
    const path = (context.params as Record<string, string>)["*"] ?? "";
    return proxyRequest(PROXY.AUTH_SERVICE_URL, context.request, path);
  }
);

// Reverse proxy cho Novel service với middleware xác thực
app.all("/novel/*", 
  createAuthMiddleware('novel'),
  async (context: Context) => {
    const path = (context.params as Record<string, string>)["*"] ?? "";
    return proxyRequest(PROXY.NOVEL_SERVICE_URL, context.request, path);
  }
);

// Health check endpoint
app.get("/health", () => ({
  status: "UP",
  services: {
    auth: `http://${PROXY.AUTH_SERVICE_URL}`,
    novel: `http://${PROXY.NOVEL_SERVICE_URL}`,
  },
  timestamp: new Date().toISOString(),
}));

// Root endpoint
app.get("/", () => "Wibu System API Gateway");

// Khởi động server
app.listen(APP_CONFIG.PORT);

console.log(
  `🦊 Elysia Gateway is running at ${app.server?.hostname}:${app.server?.port}`
);
