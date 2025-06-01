# 🚪 API Gateway Setup

## 📋 Tổng quan

**API Gateway** (`@repo/api-gateway`) là entry point chính cho tất cả các requests đến WIBUSYSTEM. Gateway này chịu trách nhiệm routing, rate limiting, và proxying requests đến các microservices phía sau. Authentication được handle qua gRPC calls đến Auth Service.

## 🎯 Mục tiêu

- ✅ **Centralized entry point** cho tất cả API requests
- ✅ **Token forwarding** đến Auth Service qua gRPC
- ✅ **Service discovery** và load balancing
- ✅ **Rate limiting** và security middleware
- ✅ **Request/Response logging** và monitoring
- ✅ **CORS handling** cho frontend applications
- ✅ **Error handling** và standardized responses

## 🎯 Authorization Strategy Comparison

### **📋 Approach 1: Static Configuration (@repo/common)**

**✅ Ưu điểm:**

- **Performance cao** - Không cần database queries
- **Type-safe** - TypeScript compile-time checking
- **Version control** - Authorization rules tracked trong git
- **Simple deployment** - Không cần sync với database
- **Cache-friendly** - Rules loaded trong memory

**❌ Nhược điểm:**

- **Requires deployment** để thay đổi rules
- **Không flexible** cho runtime configuration changes
- **Hard-coded** - Không thể customize cho từng tenant

### **🗄️ Approach 2: Dynamic Configuration (Database)**

**✅ Ưu điểm:**

- **Runtime flexibility** - Thay đổi rules không cần deploy
- **Admin panel friendly** - Easy configuration UI
- **Multi-tenant support** - Different rules cho different organizations
- **Audit trail** - Track authorization changes

**❌ Nhược điểm:**

- **Performance overhead** - Database queries cho mỗi request
- **Complexity** - Cache invalidation, consistency issues
- **Dependency** - Gateway phụ thuộc vào Auth database
- **Debugging harder** - Rules không visible trong code

### **🎯 Approach 3: Hybrid (Recommended)**

**⭐ Best of both worlds:**

```typescript
// Static base configuration trong @repo/common
export const BASE_AUTHORIZATION = {
  "/auth/login": { auth: "none" },
  "/users": { auth: "required", permissions: ["users:read"] },
  "/admin/*": { auth: "required", roles: ["admin"] },
};

// Dynamic overrides từ database
export async function getEffectiveAuthorization(
  method: string,
  path: string
): Promise<EndpointConfig> {
  // 1. Check cache first
  const cached = authCache.get(`${method}:${path}`);
  if (cached && !isExpired(cached)) {
    return cached.config;
  }

  // 2. Load dynamic rules from database
  const dynamicRule = await loadDynamicRule(method, path);
  if (dynamicRule?.isActive) {
    return dynamicRule; // Override static config
  }

  // 3. Fallback to static configuration
  return getStaticConfig(method, path);
}
```

**🏗️ Implementation Strategy:**

1. **Base Layer**: Static configuration trong `@repo/common` cho core endpoints
2. **Override Layer**: Database rules cho custom/dynamic requirements
3. **Cache Layer**: Redis cache với TTL cho performance
4. **Fallback**: Always fallback to static config nếu dynamic fails

**📊 Performance Optimization:**

```typescript
// Cache strategy
const authCache = new Map<
  string,
  {
    config: EndpointConfig;
    timestamp: number;
    ttl: number;
  }
>();

// Background refresh every 5 minutes
setInterval(
  async () => {
    await refreshAuthorizationCache();
  },
  5 * 60 * 1000
);

// Hot reload on database changes (via Redis pub/sub)
redisSubscriber.on("auth:rules:updated", async (data) => {
  const { method, path } = JSON.parse(data);
  await refreshSingleRule(method, path);
});
```

## 🏆 Final Recommendation

**Sử dụng Hybrid Approach vì:**

1. **🚀 Fast by default** - Static config cho 90% endpoints
2. **🔧 Flexible khi cần** - Dynamic rules cho special cases
3. **📈 Scalable** - Cache strategy handle high traffic
4. **🛡️ Secure fallback** - Static config backup khi dynamic fails
5. **👨‍💻 Developer friendly** - Core logic visible trong code
6. **🎛️ Admin friendly** - Dynamic rules cho business requirements

**Implementation Priority:**

1. ✅ Static configuration trong `@repo/common` (current)
2. 🔄 Cache layer với Redis
3. 🎯 Database dynamic rules (future)
4. 📊 Admin panel for rule management (future)

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │  Auth Service   │
│   (NextJS)      │◄──►│   Port: 3100     │◄──►│   Port: 3101    │
└─────────────────┘    │                  │    │   (gRPC: 31001) │
                       │  - Token Forward  │    └─────────────────┘
┌─────────────────┐    │  - Rate Limiting  │    ┌─────────────────┐
│   Mobile App    │◄──►│  - Service Proxy  │◄──►│  User Service   │
└─────────────────┘    │  - CORS           │    │   Port: 3102    │
                       │  - Logging        │    └─────────────────┘
┌─────────────────┐    │                  │    ┌─────────────────┐
│   Admin Panel   │◄──►│                  │◄──►│Translation Svc  │
└─────────────────┘    └──────────────────┘    │   Port: 3103    │
                                               └─────────────────┘
```

## 🏗️ Project Structure

```
apps/api-gateway/
├── package.json              # Dependencies và scripts
├── tsconfig.json            # TypeScript configuration
├── .env-example             # Environment variables template
├── Dockerfile               # Docker configuration
├── src/
│   ├── index.ts             # Application entry point
│   ├── gateway.ts           # Main gateway configuration
│   ├── configs/
│   │   └── env.ts          # Environment configuration
│   ├── middleware/
│   │   ├── auth.ts         # Authentication middleware (gRPC)
│   │   ├── cors.ts         # CORS configuration
│   │   ├── rate-limit.ts   # Rate limiting middleware
│   │   └── validation.ts   # Request validation
│   ├── services/
│   │   ├── auth-proxy.ts   # Auth service proxy
│   │   ├── user-proxy.ts   # User service proxy
│   │   └── translation-proxy.ts # Translation service proxy
│   ├── grpc/
│   │   ├── auth-client.ts  # gRPC client for Auth Service
│   │   └── proto/          # Protocol buffer definitions
│   ├── utils/
│   │   ├── service-discovery.ts # Service health checking
│   │   ├── error-handler.ts    # Global error handling
│   │   └── response-formatter.ts # Response formatting
│   └── types/
│       ├── gateway.ts      # Gateway-specific types
│       └── services.ts     # Service interface types
└── README.md
```

## 📦 Dependencies

**package.json**

```json
{
  "name": "@repo/api-gateway",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun build src/index.ts --outdir dist --target bun",
    "start": "bun run dist/index.js",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "docker:build": "docker build -t wibusystem-gateway .",
    "docker:run": "docker run -p 3100:3100 wibusystem-gateway"
  },
  "dependencies": {
    "@repo/shared-types": "*",
    "@repo/shared-schemas": "*",
    "@repo/elysia-common": "*",
    "elysia": "latest",
    "@elysiajs/cors": "1.3.3",
    "@elysiajs/swagger": "1.3.0",
    "@elysiajs/html": "1.3.0",
    "redis": "5.1.1",
    "dotenv": "16.5.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "@types/bun": "latest",
    "typescript": "5.8.2"
  }
}
```

## ⚙️ Environment Configuration

### Environment Variables

**apps/api-gateway/.env-example**

```bash
# Gateway Configuration
GATEWAY_PORT=3100
NODE_ENV=development
GATEWAY_HOST=0.0.0.0

# Service URLs - HTTP service communication
AUTH_SERVICE_URL=http://localhost:3101
USER_SERVICE_URL=http://localhost:3102
TRANSLATION_SERVICE_URL=http://localhost:3103

# gRPC Service URLs - For authentication validation
AUTH_GRPC_URL=localhost:31001
USER_GRPC_URL=localhost:31002
TRANSLATION_GRPC_URL=localhost:31003

# External URLs - For service discovery in production
AUTH_SERVICE_EXTERNAL_URL=https://auth.wibusystem.com
USER_SERVICE_EXTERNAL_URL=https://users.wibusystem.com
TRANSLATION_SERVICE_EXTERNAL_URL=https://translations.wibusystem.com

# Redis Configuration for rate limiting and caching
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=60000        # 1 minute
RATE_LIMIT_MAX_REQUESTS=100       # 100 requests per minute
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3002
CORS_CREDENTIALS=true

# Logging Configuration
LOG_LEVEL=info                    # debug, info, warn, error

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000       # 30 seconds
HEALTH_CHECK_TIMEOUT=5000         # 5 seconds

# Security Configuration
ENABLE_SWAGGER=true               # Disable in production
ENABLE_METRICS=true
TRUST_PROXY=false                 # Set to true behind reverse proxy
```

### Configuration Management

**src/configs/env.ts**

```typescript
interface GatewayConfig {
  // Server configuration
  port: number;
  host: string;
  nodeEnv: "development" | "staging" | "production";

  // HTTP Service URLs
  services: {
    auth: string;
    users: string;
    translations: string;
  };

  // gRPC Service URLs
  grpcServices: {
    auth: string;
    users: string;
    translations: string;
  };

  // External service URLs (for production)
  externalServices: {
    auth?: string;
    users?: string;
    translations?: string;
  };

  // Redis configuration
  redis: {
    url: string;
    password?: string;
    db: number;
  };

  // Rate limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };

  // CORS configuration
  cors: {
    origins: string[];
    credentials: boolean;
  };

  // Logging
  logging: {
    level: "debug" | "info" | "warn" | "error";
  };

  // Health check
  healthCheck: {
    interval: number;
    timeout: number;
  };

  // Security
  security: {
    enableSwagger: boolean;
    enableMetrics: boolean;
    trustProxy: boolean;
  };
}

function parseEnvArray(
  value: string | undefined,
  defaultValue: string[]
): string[] {
  if (!value) return defaultValue;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validateConfig(): GatewayConfig {
  const requiredEnvVars = [
    "REDIS_URL",
    "AUTH_SERVICE_URL",
    "USER_SERVICE_URL",
    "TRANSLATION_SERVICE_URL",
    "AUTH_GRPC_URL",
  ];

  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return {
    port: parseInt(process.env.GATEWAY_PORT || "3100"),
    host: process.env.GATEWAY_HOST || "0.0.0.0",
    nodeEnv: (process.env.NODE_ENV as any) || "development",

    services: {
      auth: process.env.AUTH_SERVICE_URL!,
      users: process.env.USER_SERVICE_URL!,
      translations: process.env.TRANSLATION_SERVICE_URL!,
    },

    grpcServices: {
      auth: process.env.AUTH_GRPC_URL!,
      users: process.env.USER_GRPC_URL || "localhost:31002",
      translations: process.env.TRANSLATION_GRPC_URL || "localhost:31003",
    },

    externalServices: {
      auth: process.env.AUTH_SERVICE_EXTERNAL_URL,
      users: process.env.USER_SERVICE_EXTERNAL_URL,
      translations: process.env.TRANSLATION_SERVICE_EXTERNAL_URL,
    },

    redis: {
      url: process.env.REDIS_URL!,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || "0"),
    },

    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
      skipSuccessfulRequests:
        process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === "true",
    },

    cors: {
      origins: parseEnvArray(process.env.CORS_ORIGIN, [
        "http://localhost:3001",
      ]),
      credentials: process.env.CORS_CREDENTIALS === "true",
    },

    logging: {
      level: (process.env.LOG_LEVEL as any) || "info",
    },

    healthCheck: {
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || "30000"),
      timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || "5000"),
    },

    security: {
      enableSwagger: process.env.ENABLE_SWAGGER === "true",
      enableMetrics: process.env.ENABLE_METRICS === "true",
      trustProxy: process.env.TRUST_PROXY === "true",
    },
  };
}

export const GATEWAY_CONFIG = validateConfig();

// Service endpoints mapping
export const SERVICE_ENDPOINTS = {
  auth: GATEWAY_CONFIG.services.auth,
  users: GATEWAY_CONFIG.services.users,
  translations: GATEWAY_CONFIG.services.translations,
} as const;

export const GRPC_ENDPOINTS = {
  auth: GATEWAY_CONFIG.grpcServices.auth,
  users: GATEWAY_CONFIG.grpcServices.users,
  translations: GATEWAY_CONFIG.grpcServices.translations,
} as const;

export type ServiceName = keyof typeof SERVICE_ENDPOINTS;
```

## 🔧 Core Implementation

### gRPC Auth Client với @repo/elysia-common

**src/grpc/auth-client.ts**

```typescript
import { grpcRegistry, GrpcClient } from "@repo/elysia-common/grpc";
import { GRPC_ENDPOINTS } from "../configs/env";

// Proto definitions từ @repo/elysia-common
interface ValidateTokenRequest {
  token: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    role: string;
    is_active: boolean;
    email_verified: boolean;
    roles: string[];
    permissions: string[];
  };
  error?: string;
}

class AuthGrpcClient {
  private client: GrpcClient;

  constructor() {
    // Sử dụng grpcRegistry từ @repo/elysia-common
    this.client = grpcRegistry.register("auth-service", {
      protoPath: "@repo/elysia-common/proto/auth.proto",
      serviceName: "auth.AuthService",
      serverAddress: GRPC_ENDPOINTS.auth,
    });
  }

  async validateToken(token: string): Promise<ValidateTokenResponse> {
    try {
      const response = await this.client.call<
        ValidateTokenRequest,
        ValidateTokenResponse
      >("validateToken", { token }, { timeout: 5000, retries: 3 });

      return response;
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || "gRPC validation failed",
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return await this.client.healthCheck();
  }
}

export const authGrpcClient = new AuthGrpcClient();
```

### Protocol Buffer Definition

**src/grpc/proto/auth.proto**

```protobuf
syntax = "proto3";

package auth;

service AuthService {
  rpc ValidateToken (ValidateTokenRequest) returns (ValidateTokenResponse);
  rpc ValidatePermissions (ValidatePermissionsRequest) returns (ValidatePermissionsResponse);
}

message ValidateTokenRequest {
  string token = 1;
}

message ValidateTokenResponse {
  bool valid = 1;
  User user = 2;
  string error = 3;
}

message ValidatePermissionsRequest {
  string token = 1;
  repeated string permissions = 2;
}

message ValidatePermissionsResponse {
  bool authorized = 1;
  User user = 2;
  string error = 3;
}

message User {
  int32 id = 1;
  string email = 2;
  string user_name = 3;
  repeated string roles = 4;
}
```

### Authentication Middleware với Authorization

**src/middleware/auth.ts**

```typescript
import { Elysia } from "elysia";
import { authGrpcClient } from "../grpc/auth-client";
import {
  getEndpointConfig,
  getEndpointConfigWithCache,
  checkPermissions,
  type AuthRequirement,
  type AuthorizationCache,
  type EndpointConfig,
} from "@repo/common/constants/api";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  email_verified: boolean;
  roles: string[];
  permissions: string[];
}

export interface AuthContext {
  user?: AuthUser;
  token?: string;
}

// Simple in-memory cache for authorization rules
let authCache: AuthorizationCache = {
  endpoints: new Map(),
  lastUpdated: new Date(),
  ttl: 5 * 60 * 1000, // 5 minutes
};

export const authMiddleware = new Elysia({ name: "auth-middleware" })
  .derive({ as: "scoped" }, async ({ headers, set, request }) => {
    const authorization = headers.authorization;
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname.replace("/api", ""); // Remove /api prefix

    // Get endpoint configuration
    const endpointConfig = getEndpointConfigWithCache(method, path, authCache);

    if (!endpointConfig) {
      // Unknown endpoint - require auth by default
      set.status = 404;
      return {
        auth: null,
        endpointConfig: null,
      };
    }

    // Handle different auth requirements
    switch (endpointConfig.auth) {
      case "none":
        return {
          auth: null,
          endpointConfig,
        };

      case "optional":
        // Try to authenticate but don't fail if missing
        if (!authorization?.startsWith("Bearer ")) {
          return {
            auth: null,
            endpointConfig,
          };
        }
        break;

      case "required":
        if (!authorization?.startsWith("Bearer ")) {
          set.status = 401;
          return {
            auth: null,
            endpointConfig,
          };
        }
        break;
    }

    // Extract and validate token
    const token = authorization!.substring(7);

    try {
      const validation = await authGrpcClient.validateToken(token);

      if (!validation.valid || !validation.user) {
        if (endpointConfig.auth === "required") {
          set.status = 401;
        }
        return {
          auth: null,
          endpointConfig,
        };
      }

      // Check role and permission requirements
      const hasAccess = checkPermissions(
        validation.user.roles,
        validation.user.permissions,
        endpointConfig.roles,
        endpointConfig.permissions
      );

      if (!hasAccess && endpointConfig.auth === "required") {
        set.status = 403;
        return {
          auth: null,
          endpointConfig,
        };
      }

      return {
        auth: {
          user: validation.user,
          token,
        } as AuthContext,
        endpointConfig,
      };
    } catch (error) {
      console.error("gRPC auth validation failed:", error);
      if (endpointConfig.auth === "required") {
        set.status = 401;
      }
      return {
        auth: null,
        endpointConfig,
      };
    }
  })
  .macro(({ onBeforeHandle }) => ({
    requireAuth(enabled: boolean = true) {
      if (enabled) {
        onBeforeHandle(({ auth, set }) => {
          if (!auth?.user) {
            set.status = 401;
            return {
              error: {
                message: "Authentication required",
                code: "UNAUTHORIZED",
              },
            };
          }
        });
      }
    },
    requirePermissions(requiredPermissions: string[]) {
      onBeforeHandle(({ auth, set }) => {
        if (!auth?.user) {
          set.status = 401;
          return {
            error: {
              message: "Authentication required",
              code: "UNAUTHORIZED",
            },
          };
        }

        const hasPermissions = checkPermissions(
          auth.user.roles,
          auth.user.permissions,
          undefined,
          requiredPermissions
        );

        if (!hasPermissions) {
          set.status = 403;
          return {
            error: {
              message: "Insufficient permissions",
              code: "FORBIDDEN",
              required: requiredPermissions,
            },
          };
        }
      });
    },
    requireRoles(requiredRoles: string[]) {
      onBeforeHandle(({ auth, set }) => {
        if (!auth?.user) {
          set.status = 401;
          return {
            error: {
              message: "Authentication required",
              code: "UNAUTHORIZED",
            },
          };
        }

        const hasRole = checkPermissions(
          auth.user.roles,
          auth.user.permissions,
          requiredRoles,
          undefined
        );

        if (!hasRole) {
          set.status = 403;
          return {
            error: {
              message: "Insufficient role permissions",
              code: "FORBIDDEN",
              required: requiredRoles,
            },
          };
        }
      });
    },
  }));

// Helper function to refresh authorization cache
export async function refreshAuthCache(): Promise<void> {
  try {
    // TODO: Load dynamic rules from database
    // const dynamicRules = await loadDynamicAuthRulesFromDB();
    // authCache.endpoints = new Map(dynamicRules);
    authCache.lastUpdated = new Date();
    console.log("Authorization cache refreshed");
  } catch (error) {
    console.error("Failed to refresh auth cache:", error);
  }
}

// Initialize cache refresh interval
setInterval(refreshAuthCache, authCache.ttl);
```

### Main Gateway Setup

**src/gateway.ts**

```typescript
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { html } from "@elysiajs/html";
import { loggerMiddleware } from "@repo/elysia-common/logger";

// Middleware imports
import { authMiddleware } from "./middleware/auth";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { validationMiddleware } from "./middleware/validation";

// Service proxy imports
import { authProxy } from "./services/auth-proxy";
import { userProxy } from "./services/user-proxy";
import { translationProxy } from "./services/translation-proxy";

// Utils imports
import { healthCheckHandler } from "./utils/service-discovery";
import { globalErrorHandler } from "./utils/error-handler";
import { GATEWAY_CONFIG } from "./configs/env";

export const gateway = new Elysia({ name: "api-gateway" })
  // Global plugins
  .use(html())

  // Logging middleware từ @repo/elysia-common
  .use(
    loggerMiddleware({
      level: GATEWAY_CONFIG.logging.level,
      service: "api-gateway",
    })
  )

  // CORS configuration
  .use(
    cors({
      origin: GATEWAY_CONFIG.cors.origins,
      credentials: GATEWAY_CONFIG.cors.credentials,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Forwarded-For",
      ],
      exposedHeaders: [
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
      ],
    })
  )

  // Swagger documentation (chỉ enable trong development)
  .use(
    GATEWAY_CONFIG.security.enableSwagger
      ? swagger({
          documentation: {
            info: {
              title: "WIBUSYSTEM API Gateway",
              version: "1.0.0",
              description:
                "API Gateway cho WIBUSYSTEM microservices với gRPC authentication",
            },
            tags: [
              { name: "Authentication", description: "Auth service endpoints" },
              { name: "Users", description: "User management endpoints" },
              {
                name: "Translations",
                description: "Translation service endpoints",
              },
              { name: "Health", description: "Health check endpoints" },
            ],
            servers: [
              {
                url: `http://localhost:${GATEWAY_CONFIG.port}`,
                description: "Development server",
              },
            ],
          },
        })
      : new Elysia()
  )

  // Core middleware
  .use(rateLimitMiddleware)
  .use(authMiddleware)
  .use(validationMiddleware)

  // Global error handling
  .onError(globalErrorHandler)

  // Health check endpoints
  .get("/health", healthCheckHandler, {
    detail: {
      tags: ["Health"],
      summary: "Check gateway health",
      description: "Returns health status of gateway and connected services",
    },
  })

  .get(
    "/health/ready",
    ({ set }) => {
      set.status = 200;
      return {
        status: "ready",
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Readiness probe",
        description: "Kubernetes readiness probe endpoint",
      },
    }
  )

  .get(
    "/health/live",
    ({ set }) => {
      set.status = 200;
      return {
        status: "alive",
        timestamp: new Date().toISOString(),
      };
    },
    {
      detail: {
        tags: ["Health"],
        summary: "Liveness probe",
        description: "Kubernetes liveness probe endpoint",
      },
    }
  )

  // Metrics endpoint (nếu enabled)
  .get("/metrics", ({ set }) => {
    if (!GATEWAY_CONFIG.security.enableMetrics) {
      set.status = 404;
      return { error: "Metrics endpoint disabled" };
    }

    // TODO: Implement metrics collection
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };
  })

  // Root endpoint
  .get("/", () => ({
    service: "WIBUSYSTEM API Gateway",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    environment: GATEWAY_CONFIG.nodeEnv,
    port: GATEWAY_CONFIG.port,
    services: {
      auth: "available",
      users: "available",
      translations: "available",
    },
  }))

  // API routes - grouped under /api prefix
  .group("/api", (app) =>
    app.use(authProxy).use(userProxy).use(translationProxy)
  )

  // Catch-all cho undefined routes
  .all("*", ({ set, request }) => {
    set.status = 404;
    return {
      error: {
        message: "Route not found",
        code: "ROUTE_NOT_FOUND",
        path: new URL(request.url).pathname,
      },
    };
  });

// Export type cho Eden client
export type App = typeof gateway;
```

### Service Proxy với Token Forwarding

**src/services/auth-proxy.ts**

```typescript
import { Elysia } from "elysia";
import { SERVICE_ENDPOINTS } from "../configs/env";

export const authProxy = new Elysia({ prefix: "/auth" })

  // Public routes - no auth required
  .post("/login", async ({ body, headers }) => {
    const response = await fetch(`${SERVICE_ENDPOINTS.auth}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(
          Object.entries(headers).filter(
            ([key]) => !["host", "content-length"].includes(key.toLowerCase())
          )
        ),
      },
      body: JSON.stringify(body),
    });

    return response.json();
  })

  .post("/register", async ({ body, headers }) => {
    const response = await fetch(`${SERVICE_ENDPOINTS.auth}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(
          Object.entries(headers).filter(
            ([key]) => !["host", "content-length"].includes(key.toLowerCase())
          )
        ),
      },
      body: JSON.stringify(body),
    });

    return response.json();
  })

  .post("/refresh", async ({ body, headers }) => {
    const response = await fetch(`${SERVICE_ENDPOINTS.auth}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(
          Object.entries(headers).filter(
            ([key]) => !["host", "content-length"].includes(key.toLowerCase())
          )
        ),
      },
      body: JSON.stringify(body),
    });

    return response.json();
  })

  // Protected routes - require auth, forward token
  .post(
    "/logout",
    async ({ headers }) => {
      const response = await fetch(`${SERVICE_ENDPOINTS.auth}/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: headers.authorization || "",
          ...Object.fromEntries(
            Object.entries(headers).filter(
              ([key]) => !["host", "content-length"].includes(key.toLowerCase())
            )
          ),
        },
      });

      return response.json();
    },
    {
      requireAuth: true,
    }
  )

  .get(
    "/profile",
    async ({ headers }) => {
      const response = await fetch(`${SERVICE_ENDPOINTS.auth}/auth/profile`, {
        method: "GET",
        headers: {
          Authorization: headers.authorization || "",
          ...Object.fromEntries(
            Object.entries(headers).filter(
              ([key]) => !["host", "content-length"].includes(key.toLowerCase())
            )
          ),
        },
      });

      return response.json();
    },
    {
      requireAuth: true,
    }
  )

  .patch(
    "/profile",
    async ({ body, headers }) => {
      const response = await fetch(`${SERVICE_ENDPOINTS.auth}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: headers.authorization || "",
          ...Object.fromEntries(
            Object.entries(headers).filter(
              ([key]) => !["host", "content-length"].includes(key.toLowerCase())
            )
          ),
        },
        body: JSON.stringify(body),
      });

      return response.json();
    },
    {
      requireAuth: true,
    }
  );
```

### Application Entry Point

**src/index.ts**

```typescript
import { gateway } from "./gateway";
import { GATEWAY_CONFIG } from "./configs/env";
import { initializeHealthChecks } from "./utils/service-discovery";

// Graceful shutdown handling
const gracefulShutdown = (signal: string) => {
  console.log(`Received ${signal}. Starting graceful shutdown...`);
  // Cleanup Redis connections, close gRPC connections, etc.
  process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Unhandled error handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

async function startGateway() {
  try {
    console.log("🚀 Starting WIBUSYSTEM API Gateway...");
    console.log(`📍 Environment: ${GATEWAY_CONFIG.nodeEnv}`);
    console.log(`🔌 HTTP Services configuration:`);
    console.log(`   - Auth Service: ${GATEWAY_CONFIG.services.auth}`);
    console.log(`   - User Service: ${GATEWAY_CONFIG.services.users}`);
    console.log(
      `   - Translation Service: ${GATEWAY_CONFIG.services.translations}`
    );

    console.log(`🔌 gRPC Services configuration:`);
    console.log(`   - Auth gRPC: ${GATEWAY_CONFIG.grpcServices.auth}`);
    console.log(`   - User gRPC: ${GATEWAY_CONFIG.grpcServices.users}`);
    console.log(
      `   - Translation gRPC: ${GATEWAY_CONFIG.grpcServices.translations}`
    );

    // Initialize health checks for services
    await initializeHealthChecks();

    // Start the gateway server
    const app = gateway.listen({
      port: GATEWAY_CONFIG.port,
      hostname: GATEWAY_CONFIG.host,
    });

    console.log(`✅ Gateway started successfully`);
    console.log(
      `🌐 Server running at http://${GATEWAY_CONFIG.host}:${GATEWAY_CONFIG.port}`
    );

    if (GATEWAY_CONFIG.security.enableSwagger) {
      console.log(
        `📚 Swagger documentation: http://${GATEWAY_CONFIG.host}:${GATEWAY_CONFIG.port}/swagger`
      );
    }

    return app;
  } catch (error) {
    console.error("❌ Failed to start gateway:", error);
    process.exit(1);
  }
}

// Start the application
await startGateway();

export { gateway };
export type { App } from "./gateway";
```

## 🐳 Docker Configuration

**Dockerfile**

```dockerfile
FROM oven/bun:1 as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/ ./packages/
COPY apps/api-gateway/ ./apps/api-gateway/

# Install dependencies
RUN bun install --frozen-lockfile

# Build the application
WORKDIR /app/apps/api-gateway
RUN bun run build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/api-gateway/dist ./dist
COPY --from=builder /app/apps/api-gateway/package.json ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 gateway
USER gateway

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3100/health || exit 1

EXPOSE 3100

CMD ["bun", "run", "dist/index.js"]
```

## 🚀 Development & Production Scripts

### Development

```bash
# Start gateway in development mode
bun dev

# Start with specific environment
NODE_ENV=staging bun dev

# Start with debug logging
LOG_LEVEL=debug bun dev
```

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun start

# Docker build and run
bun run docker:build
bun run docker:run
```

### Testing

```bash
# Run all tests
bun test

# Type checking
bun run typecheck

# Health check test
curl http://localhost:3100/health
```

## 🎯 gRPC vs JWT Validation Comparison

### **🔥 Current Approach: gRPC Authentication**

**✅ Advantages:**

- **Centralized auth logic** - Auth Service controls all authentication
- **No secret sharing** - Gateway doesn't need JWT secrets
- **Better security** - Auth logic isolated in one service
- **Easier maintenance** - Single source of truth cho authentication
- **Scalable** - gRPC performance tốt hơn HTTP cho internal calls
- **Flexible permissions** - Complex permission logic trong Auth Service

**⚠️ Considerations:**

- **Network latency** - Extra gRPC call cho mỗi authenticated request
- **Dependency** - Gateway phụ thuộc vào Auth Service availability
- **Complexity** - Phải maintain gRPC clients và proto definitions

### **⚙️ Alternative: Gateway JWT Validation**

**✅ Advantages:**

- **Performance** - Không cần extra network calls
- **Independence** - Gateway có thể validate locally
- **Simplicity** - Ít moving parts

**❌ Disadvantages:**

- **Secret management** - JWT secrets phải share
- **Duplication** - Auth logic duplicate across services
- **Security risk** - Secrets stored in multiple places
- **Maintenance** - Auth logic changes require gateway updates

## 📋 Best Practices

### 1. **gRPC Communication**

- Use connection pooling cho gRPC clients
- Implement circuit breaker cho fault tolerance
- Cache validation results với short TTL
- Monitor gRPC call performance

### 2. **Token Forwarding**

- Always forward Authorization header đến services
- Log authentication attempts cho security monitoring
- Implement rate limiting cho authentication calls

### 3. **Error Handling**

- Centralized error handling với consistent format
- Proper HTTP status codes
- Detailed logging cho debugging
- Graceful fallback khi Auth Service unavailable

### 4. **Performance**

- Connection pooling cho service calls
- Redis caching cho frequently accessed data
- Request/response compression
- Health checks cho service availability

### 5. **Security**

- Rate limiting per IP/user
- CORS configuration proper
- Input validation cho all requests
- Monitor và alert cho security events

---

**API Gateway với gRPC authentication strategy cung cấp kiến trúc microservices tối ưu, centralized security và better maintainability cho WIBUSYSTEM.**
