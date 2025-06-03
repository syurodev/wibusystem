// Demo script để test elysia-logger
import { Elysia } from "elysia";
import { createLoggerPlugin, logger } from "../src/logger/index.js";

console.log("🎨 Demo các tùy chọn màu sắc cho logger");

// Demo 1: Logger cơ bản với màu mặc định
const basicApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "basic-service",
      level: "info",
      colorize: true, // Bật màu sắc
      prettyPrint: true, // Sử dụng pino-pretty
    })
  )
  .get("/", () => "Hello with colored logs!")
  .listen(3001);

// Demo 2: Logger với custom colors
const customColorApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "custom-color-service",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      customColors: {
        // Custom màu cho từng level
        0: "blueBright", // trace
        10: "cyan", // debug
        20: "green", // info
        30: "yellow", // warn
        40: "red", // error
        50: "magentaBright", // fatal
      },
    })
  )
  .get("/test", ({ log }) => {
    log.debug("Debug message với màu cyan");
    log.info("Info message với màu xanh lá");
    log.warn("Warning message với màu vàng");
    return { status: "success", colors: "enabled" };
  })
  .get("/error-test", () => {
    logger.error("Error message với màu đỏ");
    throw new Error("Test error với màu magenta");
  })
  .listen(3002);

// Demo 3: Production mode (không có màu)
const prodApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "production-service",
      environment: "production",
      level: "warn",
      colorize: false, // Tắt màu cho production
      prettyPrint: false, // JSON format cho production
    })
  )
  .get("/prod", () => "Production logs without colors")
  .listen(3003);

console.log("🚀 Demo servers started:");
console.log("   - Basic colored logs: http://localhost:3001");
console.log("   - Custom colored logs: http://localhost:3002");
console.log("   - Production logs: http://localhost:3003");

// Standalone logger demo
console.log("\n🎨 Standalone Logger Demo:");
logger.info("This is an info message");
logger.warn("This is a warning message");
logger.error("This is an error message");

// Child logger demo
const requestLogger = logger.request("req-123", "GET", "/api/users");
requestLogger.info("Processing request");
requestLogger.warn("Rate limit approaching");

const dbLogger = logger.database("SELECT", "users");
dbLogger.info("Database query executed", { duration: "45ms", rows: 10 });

// Demo Elysia app với logger plugin
console.log("\n=== Elysia Logger Plugin Demo ===");
const app = new Elysia()
  .use(
    createLoggerPlugin({
      service: "demo-service",
      level: "info",
    })
  )
  .get("/", () => "Hello World")
  .get("/test", ({ request }) => {
    logger.info("Test endpoint called", {
      url: request.url,
      method: request.method,
    });
    return { message: "Test successful", timestamp: new Date().toISOString() };
  })
  .get("/error", () => {
    throw new Error("Test error endpoint");
  })
  .listen(3333);

console.log("🚀 Demo server started on port 3333");
console.log("Test endpoints:");
console.log("- GET http://localhost:3333/");
console.log("- GET http://localhost:3333/test");
console.log("- GET http://localhost:3333/error");
console.log("\nPress Ctrl+C to stop");

// Demo các features khác
setTimeout(() => {
  console.log("\n=== Additional Logger Features Demo ===");

  // GRPC logger
  const grpcLogger = logger.grpc("UserService", "GetUser");
  grpcLogger.info("GRPC call started", { userId: "123" });
  grpcLogger.info("GRPC call completed", { duration: "50ms" });

  // Database logger
  const databaseLogger = logger.database("INSERT", "users");
  databaseLogger.info("User created", { userId: "user-456" });
}, 1000);

export default app;
