# Logger với Màu Sắc - Elysia Common

Hệ thống logging cho Elysia backend services sử dụng `@bogeychan/elysia-logger` với hỗ trợ màu sắc thông qua `pino-pretty`.

## 🎨 Cấu Hình Màu Sắc

### 1. Cơ Bản (Sử dụng màu mặc định)

```typescript
import { createLoggerPlugin } from "@repo/elysia-common";

const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    colorize: true, // Bật màu sắc (sẽ dùng màu mặc định)
    prettyPrint: true, // Sử dụng pino-pretty formatter
  })
);
```

### 2. Custom Colors

```typescript
const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    colorize: true,
    prettyPrint: true,
    customColors: {
      0: "blueBright", // trace - xanh dương sáng
      10: "cyan", // debug - xanh ngọc
      20: "green", // info - xanh lá
      30: "yellow", // warn - vàng
      40: "red", // error - đỏ
      50: "magentaBright", // fatal - tím sáng
    },
  })
);
```

### 3. Sử dụng Color Schemes có sẵn

```typescript
import { createLoggerPlugin, COLOR_SCHEMES } from "@repo/elysia-common";

const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    colorize: true,
    prettyPrint: true,
    customColors: COLOR_SCHEMES.bright, // Sử dụng bright color scheme
  })
);
```

### 4. Tạo Custom Color Scheme

```typescript
import { createLoggerPlugin, createColorScheme } from "@repo/elysia-common";

const myColors = createColorScheme({
  20: "blue", // Override info color thành blue
  40: "redBright", // Override error color thành redBright
  // Các màu khác sẽ giữ nguyên default
});

const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    colorize: true,
    prettyPrint: true,
    customColors: myColors,
  })
);
```

### 5. Environment-based Configuration

```typescript
const isDev = process.env.NODE_ENV === "development";

const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    environment: process.env.NODE_ENV,
    colorize: isDev, // Chỉ bật màu ở development
    prettyPrint: isDev, // Chỉ dùng pretty format ở development
    level: isDev ? "debug" : "info",
  })
);
```

## 🌈 Màu Sắc Có Sẵn

Bạn có thể sử dụng các màu sau từ `colorette`:

- `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`
- `gray`, `grey`, `blackBright`, `redBright`, `greenBright`, `yellowBright`
- `blueBright`, `magentaBright`, `cyanBright`, `whiteBright`

## 📝 Log Levels và Màu Mặc Định

| Level | Number | Màu Mặc Định  | Mô Tả               |
| ----- | ------ | ------------- | ------------------- |
| trace | 0      | blueBright    | Trace execution     |
| debug | 10     | cyan          | Debug information   |
| info  | 20     | green         | General information |
| warn  | 30     | yellow        | Warning messages    |
| error | 40     | red           | Error messages      |
| fatal | 50     | magentaBright | Fatal errors        |

## 🎨 Color Schemes Có Sẵn

### Default (Mặc định)

```typescript
{
  0: 'blueBright',      // trace
  10: 'cyan',           // debug
  20: 'green',          // info
  30: 'yellow',         // warn
  40: 'red',            // error
  50: 'magentaBright',  // fatal
}
```

### Bright (Sáng và rực rỡ)

```typescript
{
  0: 'cyanBright',      // trace
  10: 'blueBright',     // debug
  20: 'greenBright',    // info
  30: 'yellowBright',   // warn
  40: 'redBright',      // error
  50: 'magentaBright',  // fatal
}
```

### Subtle (Nhẹ nhàng)

```typescript
{
  0: 'gray',            // trace
  10: 'cyan',           // debug
  20: 'blue',           // info
  30: 'yellow',         // warn
  40: 'red',            // error
  50: 'magenta',        // fatal
}
```

### Mono (Đơn sắc)

```typescript
{
  0: 'gray',            // trace
  10: 'white',          // debug
  20: 'whiteBright',    // info
  30: 'yellowBright',   // warn
  40: 'redBright',      // error
  50: 'red',            // fatal
}
```

## 🔧 Advanced Configuration

### Custom Message Format

```typescript
const app = new Elysia().use(
  createLoggerPlugin({
    service: "my-service",
    colorize: true,
    prettyPrint: true,
    customColors: {
      /* ... */
    },
    // Các options khác sẽ được pass vào pino-pretty
    messageFormat: "[{service}] {levelLabel} - {msg}",
    translateTime: "yyyy-mm-dd HH:MM:ss",
    levelFirst: true,
    singleLine: false,
    ignore: "pid,hostname",
  })
);
```

### Production vs Development

**Development:**

```typescript
// Colorized, pretty-printed logs
const devLogger = createLoggerPlugin({
  service: "auth-service",
  environment: "development",
  colorize: true,
  prettyPrint: true,
  level: "debug",
});
```

**Production:**

```typescript
// JSON structured logs, no colors
const prodLogger = createLoggerPlugin({
  service: "auth-service",
  environment: "production",
  colorize: false,
  prettyPrint: false,
  level: "info",
});
```

## 🚀 Examples

### Basic Usage

```typescript
import { Elysia } from "elysia";
import { createLoggerPlugin, logger } from "@repo/elysia-common";

const app = new Elysia()
  .use(
    createLoggerPlugin({
      service: "demo-service",
      colorize: true,
      customColors: {
        20: "green", // info
        30: "yellow", // warn
        40: "red", // error
      },
    })
  )
  .get("/", ({ log }) => {
    log.info("Request received");
    return "Hello World";
  })
  .get("/error", ({ log }) => {
    log.error("Something went wrong");
    throw new Error("Test error");
  });
```

### Standalone Logger

```typescript
import { logger } from "@repo/elysia-common";

// Basic logging
logger.info("Service started");
logger.warn("Rate limit approaching");
logger.error("Database connection failed");

// Context logging
const requestLogger = logger.request("req-123", "GET", "/api/users");
requestLogger.info("Processing request");

const dbLogger = logger.database("SELECT", "users");
dbLogger.info("Query executed", { duration: "45ms" });
```

## 🎯 Best Practices

1. **Environment-based colors**: Chỉ bật màu ở development
2. **Consistent color scheme**: Sử dụng màu consistent cho các log levels
3. **Performance**: Tắt pretty printing ở production
4. **Readability**: Chọn màu có contrast tốt với terminal background
5. **Context logging**: Sử dụng child logger với context thông tin

## 📚 Tham Khảo

- [elysia-logger Documentation](https://github.com/bogeychan/elysia-logger)
- [pino-pretty Options](https://github.com/pinojs/pino-pretty)
- [Colorette Colors](https://github.com/jorgebucaran/colorette)
