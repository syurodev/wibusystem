# @repo/config

Package quản lý cấu hình tập trung cho tất cả các ứng dụng và services trong monorepo.

## Mục đích

Package `@repo/config` được thiết kế để:

- Cung cấp một nguồn đáng tin cậy (single source of truth) cho các biến môi trường và cấu hình ứng dụng.
- Đảm bảo tính nhất quán của cấu hình trên toàn hệ thống.
- Tải và xác thực (validate) các biến môi trường một cách an toàn.
- Cung cấp cấu hình đã được định kiểu (strongly-typed) cho các services khác.
- Hỗ trợ các môi trường khác nhau (ví dụ: development, staging, production, test).

## Các tính năng chính

- **Tải biến môi trường**: Tự động tải các biến từ tệp `.env` (và các biến thể như `.env.local`, `.env.production`).
- **Xác thực Schema**: Sử dụng thư viện như [Zod](https://zod.dev/) để định nghĩa schema và xác thực các biến môi trường khi khởi tạo, đảm bảo các biến cần thiết đều có mặt và đúng định dạng.
- **Cấu hình định kiểu (Typed Configuration)**: Cung cấp một đối tượng cấu hình đã được định kiểu rõ ràng, giúp giảm lỗi và cải thiện trải nghiệm của developer (autocompletion, type checking).
- **Hỗ trợ nhiều môi trường**: Dễ dàng quản lý cấu hình cho các môi trường khác nhau.
- **Tối giản Dependencies**: Giữ cho package nhẹ nhàng và chỉ phụ thuộc vào các thư viện cần thiết (ví dụ: `dotenv`, `zod`).

## Cấu trúc thư mục gợi ý

```
packages/config/
├── src/
│   ├── schemas/                # Chứa các schema Zod cho từng phần của config
│   │   ├── app.schema.ts       # Schema cho cấu hình ứng dụng chung
│   │   ├── database.schema.ts  # Schema cho cấu hình database
│   │   ├── redis.schema.ts     # Schema cho cấu hình Redis
│   │   ├── grpc.schema.ts      # Schema cho cấu hình gRPC client/server
│   │   ├── aws.schema.ts       # Schema cho cấu hình dịch vụ AWS (ví dụ)
│   │   └── index.ts            # Export các schema
│   ├── environments/           # (Tùy chọn) Các tệp cấu hình đặc thù cho môi trường nếu không chỉ dùng .env
│   │   ├── development.ts
│   │   ├── production.ts
│   │   └── index.ts
│   ├── index.ts                # Entry point chính, export đối tượng config đã được validated
│   ├── types.ts                # (Tùy chọn) Các type definitions phức tạp hơn nếu cần
│   └── validated-env.ts        # Module tải và validate các biến môi trường, export các biến đã parse
├── .env.example                # Tệp ví dụ cho các biến môi trường
├── package.json
└── tsconfig.json
```

## Cách hoạt động và sử dụng

### 1. Định nghĩa biến môi trường

- Tất cả các biến môi trường cần thiết cho dự án sẽ được định nghĩa trong tệp `.env` ở gốc của monorepo hoặc trong các tệp `.env` của từng package/app (tùy theo chiến lược quản lý `.env` của bạn với Turborepo).
- Package `@repo/config` sẽ ưu tiên đọc các biến này.
- Một tệp `.env.example` sẽ được cung cấp trong `packages/config` (hoặc ở gốc monorepo) để liệt kê tất cả các biến môi trường cần thiết và mô tả của chúng.

**Ví dụ `.env.example`:**

```env
# Application
NODE_ENV="development" # development | staging | production | test
APP_PORT="3000"
APP_HOST="0.0.0.0"
API_PREFIX="/api"

# Database (PostgreSQL example)
DATABASE_HOST="localhost"
DATABASE_PORT="5432"
DATABASE_USER="your_db_user"
DATABASE_PASSWORD="your_db_password"
DATABASE_NAME="your_db_name"
DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5432/your_db_name?schema=public"

# Redis
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD="your_redis_password" # Để trống nếu không có password
REDIS_DB="0" # Số database Redis

# gRPC Clients/Servers (ví dụ)
# Nếu config này dành cho một gRPC server của chính service đó:
GRPC_SERVER_HOST="0.0.0.0"
GRPC_SERVER_PORT="50051"

# Nếu config này cần biết địa chỉ của các gRPC service khác (client-side config)
USER_SERVICE_GRPC_URL="localhost:50052"
NOVEL_SERVICE_GRPC_URL="localhost:50053"

# CORS
CORS_ORIGIN="http://localhost:3001,http://your.frontend.domain"

# JWT Secrets (Generate strong random strings for these)
JWT_ACCESS_TOKEN_SECRET="your_super_secret_access_token_key"
JWT_ACCESS_TOKEN_EXPIRES_IN="15m" # e.g., 15 minutes
JWT_REFRESH_TOKEN_SECRET="your_super_secret_refresh_token_key"
JWT_REFRESH_TOKEN_EXPIRES_IN="7d"  # e.g., 7 days

# Logging
LOG_LEVEL="info" # error | warn | info | http | verbose | debug | silly
```

### 2. Định nghĩa Schema và Xác thực

Trong `packages/config/src/schemas/`, chúng ta sẽ định nghĩa các schema sử dụng Zod.

**Ví dụ `packages/config/src/schemas/app.schema.ts`:**

```typescript
import { z } from "zod";

export const AppEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "staging", "production", "test"])
    .default("development"),
  APP_PORT: z.coerce.number().int().positive().default(3000),
  APP_HOST: z.string().ip({ version: "v4" }).default("0.0.0.0"),
  API_PREFIX: z.string().startsWith("/").default("/api"),
  CORS_ORIGIN: z
    .string()
    .transform((val) => val.split(",").map((s) => s.trim()))
    .default("http://localhost:3001"),
});

export type AppEnv = z.infer<typeof AppEnvSchema>;
```

**Ví dụ `packages/config/src/schemas/database.schema.ts`:**

```typescript
import { z } from "zod";

export const DatabaseEnvSchema = z.object({
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.coerce.number().int().positive(),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
  DATABASE_URL: z.string().url(), // Zod sẽ validate đây là một URL hợp lệ
});

export type DatabaseEnv = z.infer<typeof DatabaseEnvSchema>;
```

**Ví dụ `packages/config/src/schemas/redis.schema.ts`:**

```typescript
import { z } from "zod";

export const RedisEnvSchema = z.object({
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(), // Mật khẩu có thể không có
  REDIS_DB: z.coerce.number().int().min(0).default(0),
});

export type RedisEnv = z.infer<typeof RedisEnvSchema>;
```

**Ví dụ `packages/config/src/schemas/grpc.schema.ts`:**

```typescript
import { z } from "zod";

// Schema này có thể rất đa dạng tùy theo nhu cầu
// Ví dụ: Cấu hình cho một gRPC server mà service này sẽ host
export const GrpcServerEnvSchema = z.object({
  GRPC_SERVER_HOST: z.string().ip({ version: "v4" }).default("0.0.0.0"),
  GRPC_SERVER_PORT: z.coerce.number().int().positive().default(50051),
});
export type GrpcServerEnv = z.infer<typeof GrpcServerEnvSchema>;

// Ví dụ: Cấu hình cho các gRPC client kết nối tới service khác
export const GrpcClientEnvSchema = z.object({
  USER_SERVICE_GRPC_URL: z.string().min(1).default("localhost:50052"), // format host:port
  NOVEL_SERVICE_GRPC_URL: z.string().min(1).default("localhost:50053"),
  // Thêm các URL của gRPC service khác nếu cần
});
export type GrpcClientEnv = z.infer<typeof GrpcClientEnvSchema>;

// Bạn có thể chọn một hoặc kết hợp cả hai tùy theo service sử dụng config này
export const GrpcEnvSchema =
  GrpcServerEnvSchema.merge(GrpcClientEnvSchema).partial(); // partial() nếu không phải tất cả đều bắt buộc
export type GrpcEnv = z.infer<typeof GrpcEnvSchema>;
```

### 3. Tải và Validate Environment Variables

Trong `packages/config/src/validated-env.ts` (hoặc một tên tương tự):

```typescript
import dotenv from "dotenv";
import { z } from "zod";
import { AppEnvSchema } from "./schemas/app.schema";
import { DatabaseEnvSchema } from "./schemas/database.schema";
import { RedisEnvSchema } from "./schemas/redis.schema";
import { GrpcEnvSchema } from "./schemas/grpc.schema";
// Import các schema khác nếu có

// Tải biến môi trường từ .env file
// Bạn có thể tùy chỉnh đường dẫn nếu .env không nằm ở gốc process.cwd()
// Hoặc sử dụng dotenv-expand nếu cần
dotenv.config(); // Mặc định tìm .env ở process.cwd()

const FullEnvSchema = AppEnvSchema.merge(DatabaseEnvSchema)
  .merge(RedisEnvSchema)
  .merge(GrpcEnvSchema);
// .merge(AnotherSchema) ...

let validatedEnv: z.infer<typeof FullEnvSchema>;

try {
  validatedEnv = FullEnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      "❌ Invalid environment variables:",
      error.flatten().fieldErrors
    );
    // Hoặc throw một custom error
    // throw new Error('Invalid environment configuration.');
    process.exit(1); // Thoát nếu config không hợp lệ
  }
  console.error("❌ Unexpected error parsing environment variables:", error);
  process.exit(1);
}

export const env = validatedEnv;
```

### 4. Tạo và Export đối tượng Config

Trong `packages/config/src/index.ts`:

```typescript
import { env } from "./validated-env";

// Bạn có thể cấu trúc lại đối tượng config nếu muốn nhóm các biến
// Ví dụ:
// export const config = {
//   nodeEnv: env.NODE_ENV,
//   isProduction: env.NODE_ENV === 'production',
//   isDevelopment: env.NODE_ENV === 'development',
//   app: {
//     port: env.APP_PORT,
//     host: env.APP_HOST,
//     apiPrefix: env.API_PREFIX,
//   },
//   database: {
//     host: env.DATABASE_HOST,
//     port: env.DATABASE_PORT,
//     user: env.DATABASE_USER,
//     password: env.DATABASE_PASSWORD,
//     name: env.DATABASE_NAME,
//     url: env.DATABASE_URL,
//   },
//   cors: {
//     origin: env.CORS_ORIGIN,
//   },
//   jwt: {
//      accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
//      // ... các biến jwt khác
//   }
// };

// Hoặc đơn giản là export trực tiếp env đã validate nếu không cần cấu trúc lại nhiều
export const config = {
  ...env, // Spread tất cả các biến đã validate
  IS_PRODUCTION: env.NODE_ENV === "production",
  IS_DEVELOPMENT: env.NODE_ENV === "development",
  IS_TEST: env.NODE_ENV === "test",
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
  },
  grpc: {
    serverHost: env.GRPC_SERVER_HOST,
    serverPort: env.GRPC_SERVER_PORT,
    userServiceUrl: env.USER_SERVICE_GRPC_URL,
    novelServiceUrl: env.NOVEL_SERVICE_GRPC_URL,
  },
  appPort: env.APP_PORT,
};

// Export các type nếu cần thiết cho người dùng package
export type AppConfig = typeof config;
// export type DatabaseConfig = typeof config.database; // Nếu có cấu trúc lồng nhau
```

### 5. Sử dụng trong các services/apps khác

```typescript
// Trong một service bất kỳ, ví dụ: user-service
import { config } from "@repo/config";

function startServer() {
  const port = config.APP_PORT;
  const host = config.APP_HOST;
  // ...
  console.log(`Server running on ${host}:${port}`);
  console.log(`Current environment: ${config.NODE_ENV}`);
  if (config.IS_DEVELOPMENT) {
    console.log("Development mode is ON");
  }
  // Sử dụng config.DATABASE_URL để kết nối database
}

startServer();
```

## Dependencies gợi ý

Trong `packages/config/package.json`:

```json
{
  "name": "@repo/config",
  "version": "0.1.0",
  "private": true,
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "dev": "tsup src/index.ts --format cjs,esm --dts --watch",
    "lint": "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0",
    "clean": "rm -rf .turbo && rm -rf node_modules && rm -rf dist"
  },
  "dependencies": {
    "dotenv": "^16.x.x", // Luôn cập nhật phiên bản mới nhất
    "zod": "^3.x.x" // Luôn cập nhật phiên bản mới nhất
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/node": "^18.x.x || ^20.x.x", // Tùy thuộc phiên bản Node bạn dùng
    "eslint": "^8.x.x",
    "tsup": "^8.x.x",
    "typescript": "^5.x.x"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

## Quy trình làm việc

### Thêm một biến cấu hình mới

1.  **Thêm biến vào `.env.example`**: Mô tả rõ ràng ý nghĩa và các giá trị có thể có.
2.  **Cập nhật Schema Zod**: Thêm trường mới vào schema Zod tương ứng trong thư mục `src/schemas/`. Định nghĩa kiểu dữ liệu, giá trị mặc định (nếu có), và các ràng buộc validation.
3.  **(Tùy chọn) Cập nhật cấu trúc `config` object**: Nếu bạn có một cấu trúc lồng nhau trong `src/index.ts`, hãy cập nhật nó để bao gồm biến mới.
4.  **Sử dụng biến mới**: Truy cập biến thông qua đối tượng `config` đã import từ `@repo/config`.

---

Đây là một bản phác thảo ban đầu. Bạn có thể điều chỉnh các chi tiết như thư viện xác thực (ngoài Zod có thể dùng Joi, class-validator), cách cấu trúc đối tượng config cuối cùng, hoặc cách xử lý các môi trường khác nhau một cách chi tiết hơn.

Bạn thấy cấu trúc này thế nào? Có điểm nào bạn muốn làm rõ hoặc thay đổi không?
