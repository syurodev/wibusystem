# 🎨 Hướng Dẫn Cấu Hình Màu Sắc Logger

## 📋 Tổng Quan

Logger system hỗ trợ **2 loại logger**:

1. **Plugin Logger** (Elysia context) - Sử dụng `pino-pretty`
2. **Standalone Logger** - Sử dụng `colorette`

## 🔧 Cấu Hình Cơ Bản

### 1. Plugin Logger (Trong Elysia App)

```typescript
import { createLoggerPlugin, COLOR_SCHEMES } from "@repo/elysia-common";

const app = new Elysia()
  .use(
    createLoggerPlugin({
      service: "my-service",
      level: "debug",
      colorize: true, // Bật màu sắc
      prettyPrint: true, // Sử dụng pino-pretty
      customColors: COLOR_SCHEMES.bright, // Hoặc custom colors
      environment: "development", // Quan trọng!
    })
  )
  .get("/", ({ log }) => {
    log.info("Plugin logger với màu sắc!");
    return "Hello";
  });
```

### 2. Standalone Logger

```typescript
import { createLogger } from "@repo/elysia-common";

// Logger với màu sắc
const logger = createLogger({
  service: "my-service",
  colorize: true,
  environment: "development",
});

logger.info("Standalone logger với màu sắc!");
```

## 🎯 Các Trường Hợp Sử Dụng

### ✅ Logger CÓ màu sắc khi:

1. **Environment = "development"**
2. **colorize = true**
3. **prettyPrint = true** (cho plugin logger)
4. Terminal hỗ trợ colors

### ❌ Logger KHÔNG có màu khi:

1. **Environment = "production"**
2. **colorize = false**
3. **prettyPrint = false**
4. Terminal không hỗ trợ colors

## 🌈 Color Schemes Có Sẵn

```typescript
import { COLOR_SCHEMES } from "@repo/elysia-common";

// Bright colors (sáng và rực rỡ)
COLOR_SCHEMES.bright;

// Subtle colors (nhẹ nhàng)
COLOR_SCHEMES.subtle;

// Monochrome colors (đơn sắc)
COLOR_SCHEMES.mono;

// Default colors
COLOR_SCHEMES.default;
```

## 🛠️ Troubleshooting

### Vấn đề: Plugin logger có màu nhưng standalone logger không có

**Nguyên nhân**: Standalone logger chưa được cấu hình colorize

**Giải pháp**:

```typescript
// ❌ SAI
import { logger } from "@repo/elysia-common";
logger.info("Không có màu");

// ✅ ĐÚNG
const coloredLogger = createLogger({
  service: "my-service",
  colorize: true,
  environment: "development",
});
coloredLogger.info("Có màu!");
```

### Vấn đề: Logger không có màu trong terminal

**Kiểm tra**:

1. `NODE_ENV=development`
2. `colorize: true`
3. `prettyPrint: true` (plugin logger)
4. Terminal hỗ trợ ANSI colors

### Vấn đề: Production logs có màu

**Giải pháp**:

```typescript
const logger = createLoggerPlugin({
  service: "my-service",
  environment: process.env.NODE_ENV, // Quan trọng!
  colorize: process.env.NODE_ENV === "development",
  prettyPrint: process.env.NODE_ENV === "development",
});
```

## 📝 Best Practices

### 1. Environment-based Configuration

```typescript
const isDev = process.env.NODE_ENV === "development";

const loggerConfig = {
  service: "my-service",
  environment: process.env.NODE_ENV,
  colorize: isDev,
  prettyPrint: isDev,
  level: isDev ? "debug" : "info",
};
```

### 2. Consistent Service Names

```typescript
// Plugin logger
.use(createLoggerPlugin({
  service: "auth-service", // Cùng tên
}))

// Standalone logger
const logger = createLogger({
  service: "auth-service", // Cùng tên
});
```

### 3. Logger Order trong Elysia

```typescript
const app = new Elysia()
  .use(createLoggerPlugin({...})) // ĐẦU TIÊN
  .onError(({ log }) => {
    log.error("Error occurred");
  })
  .get("/", ({ log }) => {
    log.info("Request handled");
    return "Response";
  });
```

## 🎨 Custom Colors

### Tạo Custom Color Scheme

```typescript
import { createColorScheme } from "@repo/elysia-common";

const myColors = createColorScheme({
  20: "blue", // info -> blue
  30: "magenta", // warn -> magenta
  40: "redBright", // error -> bright red
  // trace, debug, fatal giữ nguyên default
});

const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    customColors: myColors,
  })
);
```

### Manual Color Configuration

```typescript
const customColors = {
  0: "gray", // trace
  10: "cyan", // debug
  20: "greenBright", // info
  30: "yellowBright", // warn
  40: "redBright", // error
  50: "magentaBright", // fatal
};
```

## 📊 Log Format Examples

### Development (có màu)

```
INFO [03:52:09.294] (auth-service): [auth-service] Request received
WARN [03:52:09.295] (auth-service): [auth-service] Rate limit approaching
ERROR [03:52:09.296] (auth-service): [auth-service] Database connection failed
```

### Production (JSON, không màu)

```json
{"timestamp":"2025-06-03T03:52:09.294Z","level":"INFO","service":"auth-service","message":"Request received"}
{"timestamp":"2025-06-03T03:52:09.295Z","level":"WARN","service":"auth-service","message":"Rate limit approaching"}
{"timestamp":"2025-06-03T03:52:09.296Z","level":"ERROR","service":"auth-service","message":"Database connection failed"}
```

## 🔗 Related Files

- `src/logger/index.ts` - Main logger implementation
- `src/logger/README.md` - Detailed documentation
- `demo/color-schemes-demo.ts` - Color schemes examples
- `demo/standalone-color-test.ts` - Standalone logger examples
