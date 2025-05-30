# @repo/elysia-common

Package chứa các utilities, middleware, và helpers dành riêng cho Elysia backend services.

## Cài đặt

```json
{
  "dependencies": {
    "@repo/elysia-common": "*",
    "@repo/common": "*"
  }
}
```

## Tính năng

### Logger

Hệ thống logging sử dụng [elysia-logger](https://github.com/bogeychan/elysia-logger) với cấu hình tối ưu cho microservices:

```typescript
import { Elysia } from "elysia";
import {
  logger,
  createLoggerPlugin,
  loggerMiddleware,
} from "@repo/elysia-common/logger";

// Sử dụng logger plugin trong Elysia app
const app = new Elysia()
  .use(
    loggerMiddleware({
      level: "info",
      service: "user-service",
    })
  )
  .get("/", () => "Hello World");

// Hoặc sử dụng standalone logger (không cần Elysia instance)
logger.info("Service started");
logger.error("Database error", error);

// Tạo logger cho specific service
const serviceLogger = createLogger({
  service: "user-service",
  level: "debug",
});

// Request logger với trace ID
const requestLogger = logger.request("req-123", "GET", "/users");
requestLogger.info("Processing request");

// Database operation logger
const dbLogger = logger.database("SELECT", "users");
dbLogger.info("Query executed");

// GRPC operation logger
const grpcLogger = logger.grpc("UserService", "GetUser");
grpcLogger.info("GRPC call started");
```

### Middleware

Bộ middleware cơ bản cho Elysia services:

```typescript
import { Elysia } from "elysia";
import {
  loggerMiddleware,
  requestId,
  cors,
  errorHandler,
  responseFormatter,
  auth,
  rateLimit,
  healthCheck,
} from "@repo/elysia-common/middleware";

const app = new Elysia()
  .use(loggerMiddleware()) // Elysia logger plugin
  .use(requestId) // Thêm request ID
  .use(cors) // CORS headers
  .use(errorHandler) // Error handling
  .use(responseFormatter) // Format response
  .use(healthCheck) // Health check endpoints
  .use(
    rateLimit({
      // Rate limiting
      max: 100,
      windowMs: 60000,
    })
  )
  .use(auth()); // JWT authentication
```

### GRPC Client

Helper cho inter-service communication:

```typescript
import { grpcRegistry, GrpcClient } from "@repo/elysia-common/grpc";

// Đăng ký GRPC service
const userService = grpcRegistry.register("user-service", {
  protoPath: "./protos/user.proto",
  serviceName: "UserService",
  serverAddress: "localhost:50051",
});

// Gọi GRPC method
const user = await userService.call<GetUserRequest, GetUserResponse>(
  "getUser",
  { id: "123" },
  { timeout: 5000, retries: 3 }
);

// Health check tất cả services
const healthStatus = await grpcRegistry.healthCheckAll();
```

### Config Management

Quản lý cấu hình từ environment variables:

```typescript
import { config } from "@repo/elysia-common/config";

// Lấy config
const dbConfig = config.getDatabase();
const redisConfig = config.getRedis();
const jwtConfig = config.getJWT();

// Check environment
if (config.isDevelopment()) {
  console.log("Running in development mode");
}
```

### Utils

Các utility functions cho backend:

```typescript
import {
  createApiResponse,
  createErrorResponse,
  createPaginatedResponse,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  maskSensitiveData,
  retryWithBackoff,
} from "@repo/elysia-common/utils";

// Tạo API response
const response = createApiResponse(userData, "User created successfully");

// Hash password với Bun
const hashedPassword = await hashPassword("password123");
const isValid = await verifyPassword("password123", hashedPassword);

// Mask sensitive data cho logging
const maskedData = maskSensitiveData({
  email: "user@example.com",
  password: "secret123",
}); // { email: 'user@example.com', password: '***masked***' }

// Retry với exponential backoff
const result = await retryWithBackoff(
  async () => {
    return await unstableApiCall();
  },
  3,
  1000
);
```

## Environment Variables

### Required

```bash
JWT_SECRET=your-super-secret-jwt-key
DB_PASSWORD=your-database-password
```

### Optional

```bash
# Service
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_SSL=false
DB_POOL_SIZE=10

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=app:

# JWT
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=my-app

# GRPC Services
GRPC_SERVICES=user-service:localhost:50051:./protos/user.proto,order-service:localhost:50052:./protos/order.proto
```

## Cấu trúc

```
src/
├── logger/          # Logging system với elysia-logger
├── middleware/      # Elysia middleware
├── grpc/           # GRPC client helpers
├── config/         # Configuration management
└── utils/          # Backend utilities
```

## Logger Features

### 1. Elysia Plugin Integration

- Tích hợp native với Elysia framework
- Automatic request/response logging
- Configurable log levels và formats

### 2. Standalone Logger

- Sử dụng được độc lập không cần Elysia instance
- Child logger với context bindings
- Specialized loggers cho database, GRPC operations

### 3. Development vs Production

- Development: Colored console output
- Production: Structured JSON logs
- Configurable theo environment

## Best Practices

1. **Sử dụng middleware theo thứ tự**: loggerMiddleware → requestId → cors → errorHandler → responseFormatter
2. **Log với context**: Sử dụng child logger với requestId và operation type
3. **Config validation**: Tất cả config đều được validate khi khởi tạo
4. **Error handling**: Sử dụng standardized error responses
5. **GRPC health checks**: Implement health check cho tất cả services
6. **Logger performance**: Elysia-logger được tối ưu cho high-performance applications

## Proto Files (gRPC)

Package này bao gồm các proto files để define gRPC services và message types được shared giữa các microservices.

### Available Proto Files

- **user.proto** - User management service với CRUD operations
- **auth.proto** - Authentication service với login/register/token operations
- **notification.proto** - Notification service với real-time và bulk operations

### Usage

```typescript
import {
  loadAllProtos,
  loadServiceConstructors,
  createGrpcClient,
  PROTO_PATHS,
} from "@repo/elysia-common/proto";

// Load tất cả proto definitions
const protos = loadAllProtos();

// Load service constructors
const { UserService, AuthService } = loadServiceConstructors();

// Create gRPC clients
const userClient = createGrpcClient(UserService, "localhost:50051");

const authClient = createGrpcClient(AuthService, "localhost:50052");

// Sử dụng clients
const user = await userClient.GetUser({ id: "123" });
const tokens = await authClient.Login({
  email: "user@example.com",
  password: "password123",
});
```

### Generating TypeScript Types

Để generate TypeScript types từ proto files:

```bash
# Generate types
bun run proto:build

# Or manually
bun run generate-types
```

**Note**: Requires `protoc` và `protoc-gen-ts` installed:

```bash
# Install protoc (depends on your OS)
# MacOS: brew install protobuf
# Ubuntu: apt-get install protobuf-compiler

# Install TypeScript generator
npm install -g protoc-gen-ts
```

Generated types sẽ được placed trong `src/generated/` directory.

### Integration với Microservices

#### gRPC Server Implementation

```typescript
// user-service/src/grpc-server.ts
import * as grpc from "@grpc/grpc-js";
import { loadServiceConstructors } from "@repo/elysia-common/proto";

const { UserService } = loadServiceConstructors();

const server = new grpc.Server();

server.addService(UserService.service, {
  GetUser: async (call, callback) => {
    try {
      const { id } = call.request;
      const user = await getUserById(id);
      callback(null, {
        success: true,
        user,
        message: "User retrieved successfully",
      });
    } catch (error) {
      callback(error);
    }
  },

  ListUsers: async (call, callback) => {
    // Implementation...
  },
});

server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
    console.log("User gRPC server started on port 50051");
  }
);
```

#### gRPC Client Usage

```typescript
// notification-service/src/clients/user-client.ts
import {
  createGrpcClient,
  loadServiceConstructors,
} from "@repo/elysia-common/proto";

const { UserService } = loadServiceConstructors();

export const userClient = createGrpcClient(
  UserService,
  process.env.USER_SERVICE_URL ?? "localhost:50051"
);

// Usage trong notification service
export const getUserForNotification = async (userId: string) => {
  return new Promise((resolve, reject) => {
    userClient.GetUser({ id: userId }, (error: any, response: any) => {
      if (error) reject(error);
      else resolve(response.user);
    });
  });
};
```

### Proto File Structure

```
src/proto/
├── user.proto         - User management operations
├── auth.proto         - Authentication operations
├── notification.proto - Notification operations
├── index.ts          - Proto utilities và exports
└── README.md         - Proto documentation

src/generated/        - Auto-generated types (optional)
├── user_pb.ts       - Generated from user.proto
├── auth_pb.ts       - Generated from auth.proto
├── notification_pb.ts - Generated from notification.proto
└── index.ts         - Export all generated types
```

### Best Practices

1. **Versioning**: Khi cần breaking changes, tạo folders mới `v2/`, `v3/`
2. **Backwards Compatibility**: Thêm fields mới với optional, avoid removing fields
3. **Documentation**: Comment các fields và methods trong proto files
4. **Type Safety**: Sử dụng generated TypeScript types khi possible
5. **Error Handling**: Implement proper error responses trong service methods
