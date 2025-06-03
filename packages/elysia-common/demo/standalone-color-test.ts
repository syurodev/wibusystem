import { createLogger, logger } from "../src/logger";

console.log("🎨 Testing Standalone Logger Colors\n");

console.log("1️⃣ Default standalone logger:");
logger.debug("Debug message với màu cyan");
logger.info("Info message với màu xanh lá");
logger.warn("Warning message với màu vàng");
logger.error("Error message với màu đỏ");

console.log("\n2️⃣ Custom standalone logger với colors:");
const customLogger = createLogger({
  service: "custom-service",
  colorize: true,
  environment: "development",
});

customLogger.debug("Custom debug log");
customLogger.info("Custom info log");
customLogger.warn("Custom warning log");
customLogger.error("Custom error log");

console.log("\n3️⃣ Production logger (no colors):");
const prodLogger = createLogger({
  service: "prod-service",
  colorize: false,
  environment: "production",
});

prodLogger.info("Production info log");
prodLogger.warn("Production warning log");
prodLogger.error("Production error log");

console.log("\n4️⃣ Child loggers:");
const requestLogger = logger.request("req-456", "POST", "/api/test");
requestLogger.info("Processing POST request");
requestLogger.warn("Slow response detected");

const dbLogger = logger.database("INSERT", "users");
dbLogger.info("Database insert completed", {
  affectedRows: 1,
  duration: "12ms",
});

console.log("\n✅ Standalone logger color test completed!");
