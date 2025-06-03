import { Elysia } from "elysia";
import {
  COLOR_SCHEMES,
  createColorScheme,
  createLoggerPlugin,
  DEFAULT_LOG_COLORS,
} from "../src/logger";

console.log("🌈 Demo Color Schemes cho Logger\n");

// Demo 1: Default colors (không cần specify customColors)
console.log("1️⃣ Default Colors:");
const defaultApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "default-colors",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      // Không cần customColors - sẽ dùng DEFAULT_COLORS
    })
  )
  .get("/default", ({ log }) => {
    log.debug("🔵 Debug với default colors");
    log.info("🟢 Info với default colors");
    log.warn("🟡 Warn với default colors");
    log.error("🔴 Error với default colors");
    return "Default colors demo";
  });

// Demo 2: Bright color scheme
console.log("2️⃣ Bright Color Scheme:");
const brightApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "bright-colors",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      customColors: COLOR_SCHEMES.bright,
    })
  )
  .get("/bright", ({ log }) => {
    log.debug("💫 Debug với bright colors");
    log.info("✨ Info với bright colors");
    log.warn("⚡ Warn với bright colors");
    log.error("🔥 Error với bright colors");
    return "Bright colors demo";
  })
  .listen(3001);

// Demo 3: Subtle color scheme
console.log("3️⃣ Subtle Color Scheme:");
const subtleApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "subtle-colors",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      customColors: COLOR_SCHEMES.subtle,
    })
  )
  .get("/subtle", ({ log }) => {
    log.debug("🌊 Debug với subtle colors");
    log.info("🌿 Info với subtle colors");
    log.warn("🍂 Warn với subtle colors");
    log.error("🍷 Error với subtle colors");
    return "Subtle colors demo";
  })
  .listen(3002);

// Demo 4: Mono color scheme
console.log("4️⃣ Mono Color Scheme:");
const monoApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "mono-colors",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      customColors: COLOR_SCHEMES.mono,
    })
  )
  .get("/mono", ({ log }) => {
    log.debug("⚪ Debug với mono colors");
    log.info("⬜ Info với mono colors");
    log.warn("🟨 Warn với mono colors");
    log.error("🟥 Error với mono colors");
    return "Mono colors demo";
  })
  .listen(3003);

// Demo 5: Custom color scheme với createColorScheme
console.log("5️⃣ Custom Color Scheme:");
const customColors = createColorScheme({
  10: "magenta", // debug thành màu tím
  20: "blueBright", // info thành xanh dương sáng
  30: "redBright", // warn thành đỏ sáng (unusual but for demo)
  // trace, error, fatal giữ nguyên default
});

const customApp = new Elysia()
  .use(
    createLoggerPlugin({
      service: "custom-colors",
      level: "debug",
      colorize: true,
      prettyPrint: true,
      customColors: customColors,
    })
  )
  .get("/custom", ({ log }) => {
    log.debug("🔮 Debug với custom colors");
    log.info("💙 Info với custom colors");
    log.warn("❤️ Warn với custom colors");
    log.error("🖤 Error với custom colors");
    return "Custom colors demo";
  })
  .listen(3004);

// Test tất cả các endpoints
async function testAllColorSchemes() {
  console.log("\n🚀 Testing all color schemes...\n");

  await new Promise((resolve) => setTimeout(resolve, 100));

  try {
    await fetch("http://localhost:3000/default");
    await fetch("http://localhost:3001/bright");
    await fetch("http://localhost:3002/subtle");
    await fetch("http://localhost:3003/mono");
    await fetch("http://localhost:3004/custom");

    console.log("\n✅ Tất cả color schemes đã được test!");
    console.log("\n📋 Available Color Schemes:");
    console.log("   - DEFAULT:", DEFAULT_LOG_COLORS);
    console.log("   - BRIGHT:", COLOR_SCHEMES.bright);
    console.log("   - SUBTLE:", COLOR_SCHEMES.subtle);
    console.log("   - MONO:", COLOR_SCHEMES.mono);
    console.log("   - CUSTOM:", customColors);
  } catch (error) {
    console.error("❌ Error testing endpoints:", error);
  }
}

// Start default app
defaultApp.listen(3000);

console.log("\n🌐 Demo servers started:");
console.log("   - Default: http://localhost:3000/default");
console.log("   - Bright: http://localhost:3001/bright");
console.log("   - Subtle: http://localhost:3002/subtle");
console.log("   - Mono: http://localhost:3003/mono");
console.log("   - Custom: http://localhost:3004/custom");

// Test after a short delay
setTimeout(testAllColorSchemes, 500);

// Auto exit after 5 seconds
setTimeout(() => {
  console.log("\n👋 Kết thúc color schemes demo");
  process.exit(0);
}, 5000);
