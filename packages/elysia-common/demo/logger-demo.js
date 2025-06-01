// Demo script để test elysia-logger
import { Elysia } from "elysia";
import { createLoggerPlugin, logger } from "../src/logger/index.js";
// Demo standalone logger
console.log("=== Standalone Logger Demo ===");
logger.info("Service starting up");
logger.warn("This is a warning");
logger.error("This is an error", new Error("Test error"));
// Demo child logger
const requestLogger = logger.request("req-123", "GET", "/test");
requestLogger.info("Processing request");
const dbLogger = logger.database("SELECT", "users");
dbLogger.info("Executing query");
// Demo Elysia app với logger plugin
console.log("\n=== Elysia Logger Plugin Demo ===");
const app = new Elysia()
    .use(createLoggerPlugin({
    service: "demo-service",
    level: "info",
}))
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
