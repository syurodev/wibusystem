# Ví dụ sử dụng @repo/common và @repo/elysia-common

## Tạo một Elysia service đơn giản

### 1. Setup package.json

```json
{
  "name": "user-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "build": "bun build src/index.ts --outdir ./dist",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/common": "*",
    "@repo/elysia-common": "*",
    "elysia": "latest"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "@types/bun": "latest",
    "typescript": "5.8.2"
  }
}
```

### 2. Tạo main server file

```typescript
// src/index.ts
import { Elysia } from "elysia";
import {
  loggerMiddleware,
  requestId,
  cors,
  errorHandler,
  responseFormatter,
  healthCheck,
  rateLimit,
} from "@repo/elysia-common/middleware";
import { logger } from "@repo/elysia-common/logger";
import { config } from "@repo/elysia-common/config";
import { userRoutes } from "./routes/users";

const app = new Elysia()
  // Middleware setup
  .use(
    loggerMiddleware({
      service: config.getService().name,
      level: config.getService().logLevel as any,
    })
  )
  .use(requestId)
  .use(cors)
  .use(errorHandler)
  .use(responseFormatter)
  .use(healthCheck)
  .use(rateLimit({ max: 100, windowMs: 60000 }))

  // Routes
  .group("/api/v1", (app) => app.use(userRoutes))

  // Start server
  .listen(config.getService().port);

logger.info("🚀 User service started", {
  port: config.getService().port,
  environment: config.getService().environment,
});

export default app;
```

### 3. Tạo user routes

```typescript
// src/routes/users.ts
import { Elysia, t } from "elysia";
import { logger } from "@repo/elysia-common/logger";
import {
  createApiResponse,
  createPaginatedResponse,
} from "@repo/elysia-common/utils";
import { paginationSchema } from "@repo/common/schemas";
import type { User } from "@repo/common/types";
import { userService } from "../services/user-service";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get(
    "/",
    async ({ query, requestId }) => {
      const requestLogger = logger.request(requestId, "GET", "/users");

      try {
        // Validate pagination
        const pagination = paginationSchema.parse(query);

        requestLogger.info("Fetching users with pagination", { pagination });

        const result = await userService.getUsers(pagination);

        return createPaginatedResponse(result.users, {
          ...pagination,
          total: result.total,
        });
      } catch (error) {
        requestLogger.error("Failed to fetch users", error as Error);
        throw error;
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Number({ minimum: 1 })),
        limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
        sortBy: t.Optional(t.String()),
        sortOrder: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
      }),
    }
  )

  .get(
    "/:id",
    async ({ params, requestId }) => {
      const requestLogger = logger.request(
        requestId,
        "GET",
        `/users/${params.id}`
      );

      try {
        requestLogger.info("Fetching user by ID", { userId: params.id });

        const user = await userService.getUserById(params.id);

        if (!user) {
          throw new Error("User not found");
        }

        return createApiResponse(user, "User retrieved successfully");
      } catch (error) {
        requestLogger.error("Failed to fetch user", error as Error);
        throw error;
      }
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )

  .post(
    "/",
    async ({ body, requestId }) => {
      const requestLogger = logger.request(requestId, "POST", "/users");

      try {
        requestLogger.info("Creating new user");

        const user = await userService.createUser(body);

        return createApiResponse(user, "User created successfully");
      } catch (error) {
        requestLogger.error("Failed to create user", error as Error);
        throw error;
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2 }),
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 8 }),
      }),
    }
  );
```

### 4. Tạo user service

```typescript
// src/services/user-service.ts
import { logger } from "@repo/elysia-common/logger";
import { hashPassword } from "@repo/elysia-common/utils";
import { generateId, formatDate } from "@repo/common/utils";
import type { User, PaginationParams } from "@repo/common/types";

interface CreateUserData {
  name: string;
  email: string;
  password: string;
}

interface GetUsersResult {
  users: User[];
  total: number;
}

class UserService {
  private users: User[] = []; // In-memory storage for demo

  async getUsers(pagination: PaginationParams): Promise<GetUsersResult> {
    const dbLogger = logger.database("SELECT", "users");

    try {
      dbLogger.info("Fetching users from database", { pagination });

      // Simulate database query
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;

      const users = this.users.slice(startIndex, endIndex);
      const total = this.users.length;

      dbLogger.info("Users fetched successfully", {
        count: users.length,
        total,
      });

      return { users, total };
    } catch (error) {
      dbLogger.error("Failed to fetch users", error as Error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const dbLogger = logger.database("SELECT", "users");

    try {
      dbLogger.info("Fetching user by ID", { userId: id });

      const user = this.users.find((u) => u.id === id) || null;

      if (user) {
        dbLogger.info("User found", { userId: id });
      } else {
        dbLogger.warn("User not found", { userId: id });
      }

      return user;
    } catch (error) {
      dbLogger.error("Failed to fetch user by ID", error as Error);
      throw error;
    }
  }

  async createUser(data: CreateUserData): Promise<User> {
    const dbLogger = logger.database("INSERT", "users");

    try {
      dbLogger.info("Creating new user", { email: data.email });

      // Check if user exists
      const existingUser = this.users.find((u) => u.email === data.email);
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      const hashedPassword = await hashPassword(data.password);

      // Create user
      const user: User = {
        id: generateId(),
        name: data.name,
        email: data.email,
        createdAt: formatDate(),
        updatedAt: formatDate(),
      };

      // Save to "database"
      this.users.push(user);

      dbLogger.info("User created successfully", { userId: user.id });

      return user;
    } catch (error) {
      dbLogger.error("Failed to create user", error as Error);
      throw error;
    }
  }
}

export const userService = new UserService();
```

### 5. Environment file

```bash
# .env
SERVICE_NAME=user-service
SERVICE_VERSION=1.0.0
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

JWT_SECRET=super-secret-jwt-key-for-development
DB_PASSWORD=your-database-password

DB_HOST=localhost
DB_PORT=5432
DB_NAME=userdb
DB_USER=postgres

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_KEY_PREFIX=user-service:
```

### 6. Chạy service

```bash
bun run dev
```

### 7. Test API

```bash
# Health check
curl http://localhost:3001/health

# Get users
curl http://localhost:3001/api/v1/users?page=1&limit=10

# Create user
curl -X POST http://localhost:3001/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'

# Get specific user
curl http://localhost:3001/api/v1/users/USER_ID
```

## Logger Output Examples

### Development Mode

```bash
[2025-01-XX 15:30:45] INFO (user-service): 🚀 User service started {"port":3001,"environment":"development"}
[2025-01-XX 15:30:46] INFO (user-service): Request started {"requestId":"1234-5678","method":"GET","url":"http://localhost:3001/api/v1/users"}
[2025-01-XX 15:30:46] INFO (user-service): Fetching users with pagination {"requestId":"1234-5678","method":"GET","url":"/users","type":"request","meta":{"pagination":{"page":1,"limit":10}}}
```

### Production Mode

```json
{"timestamp":"2025-01-XX 15:30:45","level":"INFO","service":"user-service","environment":"production","message":"🚀 User service started","meta":{"port":3001,"environment":"production"}}
{"timestamp":"2025-01-XX 15:30:46","level":"INFO","service":"user-service","environment":"production","message":"Request started","meta":{"requestId":"1234-5678","method":"GET","url":"http://localhost:3001/api/v1/users"}}
```

## Tích hợp với Frontend (Next.js)

```typescript
// Frontend code sử dụng @repo/common
import type { ApiResponse, User } from "@repo/common/types";
import { API_ROUTES, HTTP_STATUS } from "@repo/common/constants";
import { isValidEmail } from "@repo/common/utils";
import { loginSchema } from "@repo/common/schemas";

// API client
async function getUsers(): Promise<ApiResponse<User[]>> {
  const response = await fetch(`${API_BASE_URL}${API_ROUTES.USERS.BASE}`);
  return response.json();
}

// Form validation
function validateLoginForm(email: string, password: string) {
  try {
    loginSchema.parse({ email, password });
    return { valid: true };
  } catch (error) {
    return { valid: false, errors: error.errors };
  }
}
```

## Lợi ích của approach này

1. **Code reuse**: Types, constants, utils được dùng chung
2. **Consistency**: API responses có format thống nhất
3. **Type safety**: Full TypeScript support across all services
4. **Maintainability**: Dễ maintain và update
5. **Performance**: Tối ưu cho Bun runtime với elysia-logger
6. **Observability**: Structured logging với correlation IDs
7. **Scalability**: Dễ dàng scale microservices
8. **Native Integration**: Elysia-logger tích hợp native với Elysia framework
