import { Elysia } from "elysia";
import { createLoggerPlugin, logger } from "../src/logger";

console.log("🎨 Testing Logger Colors\n");

// Test 1: Basic colors
console.log("1️⃣ Test cơ bản với màu mặc định:");
const basicApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "color-test",
      level: "debug",
      colorize: true,
      prettyPrint: true,
    })
  )
  .get("/test", ({ log }) => {
    log.debug("🔵 DEBUG message (blueBright)");
    log.info("🟢 INFO message (green)");
    log.warn("🟡 WARN message (yellow)");
    log.error("🔴 ERROR message (red)");
    return "Color test completed";
  });

// Test endpoints để xem màu
setTimeout(async () => {
  await fetch("http://localhost:3000/test");
}, 100);

// Test 2: Custom colors
console.log("\n2️⃣ Test với custom colors:");
const customApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "custom-colors",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      customColors: {
        10: "cyan", // debug - xanh ngọc
        20: "greenBright", // info - xanh lá sáng
        30: "yellowBright", // warn - vàng sáng
        40: "redBright", // error - đỏ sáng
        50: "magentaBright", // fatal - tím sáng
      },
    })
  )
  .get("/custom", ({ log }) => {
    log.debug("🟦 CUSTOM DEBUG (cyan)");
    log.info("🟢 CUSTOM INFO (greenBright)");
    log.warn("🟨 CUSTOM WARN (yellowBright)");
    log.error("🟥 CUSTOM ERROR (redBright)");
    return "Custom colors test completed";
  })
  .listen(3001);

setTimeout(async () => {
  await fetch("http://localhost:3001/custom");
}, 200);

// Test 3: Standalone logger
console.log("\n3️⃣ Test standalone logger:");
logger.info("🚀 Service khởi động");
logger.warn("⚠️ Cảnh báo: Rate limit gần đạt");
logger.error("❌ Lỗi kết nối database");

// Test 4: Child loggers
console.log("\n4️⃣ Test child loggers với context:");
const requestLogger = logger.request("req-001", "POST", "/api/auth/login");
requestLogger.info("📝 Xử lý đăng nhập");
requestLogger.warn("⏰ Thời gian xử lý lâu");

const dbLogger = logger.database("UPDATE", "users");
dbLogger.info("✅ Cập nhật thành công", {
  affected: 1,
  duration: "23ms",
});

const grpcLogger = logger.grpc("AuthService", "ValidateToken");
grpcLogger.info("🔐 Xác thực token", {
  userId: "user-123",
  tokenType: "access",
});

console.log("\n🎉 Color test hoàn thành! Kiểm tra các màu sắc ở trên.");

basicApp.listen(3000);

// Tự động thoát sau 3 giây
setTimeout(() => {
  console.log("\n👋 Kết thúc color test");
  process.exit(0);
}, 3000);
