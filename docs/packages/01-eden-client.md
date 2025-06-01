# 📦 Eden Client Package

## 📋 Tổng quan

**Eden Client** (`@repo/eden-client`) là package cung cấp type-safe client library để kết nối frontend với backend services trong WIBUSYSTEM. Package này sử dụng [Eden Treaty](https://elysiajs.com/eden/overview.html) để đảm bảo end-to-end type safety mà không cần code generation.

## 🎯 Mục tiêu

- ✅ **End-to-end type safety** từ backend đến frontend
- ✅ **Auto-completion** đầy đủ trong IDE
- ✅ **Error handling** với type narrowing
- ✅ **Authentication** tự động với JWT tokens
- ✅ **Environment management** cho dev/staging/production
- ✅ **Request/Response interceptors**

## 🏗️ Cấu trúc Package

```
packages/eden-client/
├── package.json               # Package configuration
├── tsconfig.json             # TypeScript configuration
├── src/
│   ├── index.ts              # Main exports
│   ├── types.ts              # Type definitions
│   ├── clients/              # Service-specific clients
│   │   ├── index.ts         # Re-exports
│   │   ├── auth.ts          # Authentication client
│   │   ├── users.ts         # User management client
│   │   └── translations.ts  # Translation client
│   └── utils/
│       ├── error-handler.ts  # Error handling utilities
│       └── interceptors.ts   # Request/response interceptors
└── README.md
```

## 📋 Dependencies

```json
{
  "dependencies": {
    "@elysiajs/eden": "^1.0.0"
  },
  "peerDependencies": {
    "@repo/api-gateway": "*"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "tsup": "^8.0.0",
    "typescript": "^5.0.0"
  }
}
```

## 🚀 Installation & Setup

### 1. Install Package

```bash
# Trong NextJS app hoặc frontend project
bun add @repo/eden-client
```

### 2. Environment Configuration

```typescript
// Environment variables
NEXT_PUBLIC_API_URL=http://localhost:3000  # API Gateway URL
NODE_ENV=development
```

### 3. Basic Usage

```typescript
import { apiClient, authClient } from "@repo/eden-client";

// Sử dụng main API client
const { data, error } = await apiClient.users.get();

// Sử dụng service-specific client
const loginResult = await authClient.login({
  email: "user@example.com",
  password: "password123",
});
```

## 🔧 Core Components

### 1. Main API Client

```typescript
// src/index.ts
import { treaty } from "@elysiajs/eden";
import type { App } from "@repo/api-gateway";

export const createApiClient = (config?: Partial<ClientConfig>) => {
  const env = (process.env.NODE_ENV as Environment) || "development";
  const envConfig = environments[env];

  const clientConfig: ClientConfig = {
    baseUrl: envConfig.apiGateway,
    timeout: 30000,
    retries: 3,
    headers: {},
    ...config,
  };

  return treaty<App>(clientConfig.baseUrl, {
    headers: addAuthHeaders(clientConfig.headers),
    onError: ({ error, code }) => {
      console.error(`API Error [${code}]:`, error);

      // Auto logout on 401
      if (code === 401) {
        setAuthTokens(null);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
      }
    },
  });
};

export const apiClient = createApiClient();
```

### 2. Authentication Management

```typescript
// src/utils/interceptors.ts
let authTokens: AuthTokens | null = null;

export function setAuthTokens(tokens: AuthTokens | null) {
  authTokens = tokens;

  // Persist to localStorage in browser
  if (typeof window !== "undefined") {
    if (tokens) {
      localStorage.setItem("auth_tokens", JSON.stringify(tokens));
    } else {
      localStorage.removeItem("auth_tokens");
    }
  }
}

export function getAuthHeaders(): Record<string, string> {
  if (!authTokens?.accessToken) {
    return {};
  }

  return {
    Authorization: `Bearer ${authTokens.accessToken}`,
  };
}
```

### 3. Error Handling

```typescript
// src/utils/error-handler.ts
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(error: ClientError) {
    super(error.message);
    this.name = "ApiError";
    this.status = error.status;
    this.code = error.code;
    this.details = error.details;
  }
}

export function handleApiError(response: any): never {
  const error: ClientError = {
    status: response.status || 500,
    message: response.error?.message || "Unknown error occurred",
    code: response.error?.code,
    details: response.error?.details,
  };

  throw new ApiError(error);
}
```

### 4. Service-specific Clients

```typescript
// src/clients/auth.ts
export const authClient = {
  async login(credentials: { email: string; password: string }) {
    const { data, error } = await apiClient.auth.login.post(credentials);

    if (error) {
      handleApiError(error);
    }

    // Auto-set tokens after successful login
    if (data?.access_token && data?.refresh_token) {
      setAuthTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    }

    return data;
  },

  async refreshToken(refreshToken: string) {
    const { data, error } = await apiClient.auth.refresh.post({
      refresh_token: refreshToken,
    });

    if (error) {
      handleApiError(error);
    }

    // Update tokens
    if (data?.access_token) {
      setAuthTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
      });
    }

    return data;
  },

  async logout() {
    try {
      await apiClient.auth.logout.post({});
    } finally {
      // Clear tokens regardless of API response
      setAuthTokens(null);
    }
  },
};
```

## 🌍 Environment Management

```typescript
// src/types.ts
export type Environment = "development" | "staging" | "production";

export interface EnvironmentConfig {
  apiGateway: string;
  authService?: string;
  userService?: string;
  translationService?: string;
}

// src/index.ts
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    apiGateway: "http://localhost:3000",
    authService: "http://localhost:3101",
    userService: "http://localhost:3102",
    translationService: "http://localhost:3103",
  },
  staging: {
    apiGateway: "https://api-staging.wibusystem.com",
  },
  production: {
    apiGateway: "https://api.wibusystem.com",
  },
};
```

## 🔗 Frontend Integration

### 1. NextJS App Router

```typescript
// app/lib/api.ts
import { createApiClient, authClient, setAuthTokens } from "@repo/eden-client";

export const api = createApiClient();

// Initialize auth tokens from localStorage
if (typeof window !== "undefined") {
  const stored = localStorage.getItem("auth_tokens");
  if (stored) {
    try {
      const tokens = JSON.parse(stored);
      setAuthTokens(tokens);
    } catch {
      localStorage.removeItem("auth_tokens");
    }
  }
}
```

### 2. React Hooks

```typescript
// hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@repo/eden-client";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authClient.login,
    onSuccess: (data) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });
}

export function useUserProfile() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await api.auth.profile.get();
      return data;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 401 (unauthorized)
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });
}
```

### 3. Authentication Context

```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { authClient, getAuthTokens } from '@repo/eden-client'

interface AuthContextValue {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing tokens and validate
    const tokens = getAuthTokens()
    if (tokens) {
      // Validate tokens with backend
      validateTokens()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const result = await authClient.login(credentials)
    setUser(result.user)
  }

  const logout = async () => {
    await authClient.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

## 🧪 Testing

### 1. Unit Tests

```typescript
// __tests__/eden-client.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { createApiClient, setAuthTokens } from "../src";

describe("Eden Client", () => {
  beforeEach(() => {
    // Reset auth state
    setAuthTokens(null);
  });

  it("should create client with default config", () => {
    const client = createApiClient();
    expect(client).toBeDefined();
  });

  it("should handle authentication tokens", () => {
    const tokens = {
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    };

    setAuthTokens(tokens);
    // Test that subsequent requests include auth headers
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/integration.test.ts
import { describe, it, expect } from "bun:test";
import { authClient } from "../src/clients/auth";

describe("Auth Client Integration", () => {
  it("should login successfully", async () => {
    const result = await authClient.login({
      email: "test@example.com",
      password: "password123",
    });

    expect(result).toHaveProperty("access_token");
    expect(result).toHaveProperty("user");
  });
});
```

## 📊 Type Safety Examples

### 1. Full Type Inference

```typescript
// Tất cả đều có type safety
const { data } = await apiClient.users({ id: 123 }).get();
//    ^? data: User | undefined

const { error } = await apiClient.auth.login.post({
  email: "test@example.com",
  password: "password123",
});
//    ^? error: { message: string; code?: string } | undefined
```

### 2. Parameter Validation

```typescript
// TypeScript sẽ báo lỗi nếu thiếu required fields
await apiClient.auth.login.post({
  email: "test@example.com",
  // ❌ TypeScript error: Property 'password' is missing
});

// Route parameters cũng được validate
await apiClient.users({ id: "invalid" }).get();
// ❌ TypeScript error: Argument of type 'string' is not assignable to parameter of type 'number'
```

## 🚀 Advanced Usage

### 1. Custom Client Configuration

```typescript
// Tạo client cho specific service
const customClient = createApiClient({
  baseUrl: "https://custom-api.example.com",
  timeout: 60000,
  headers: {
    "Custom-Header": "value",
  },
});
```

### 2. Request Interceptors

```typescript
// Add custom request interceptor
const clientWithInterceptor = createApiClient({
  onRequest: ({ request }) => {
    console.log("Making request to:", request.url);
    return request;
  },
  onResponse: ({ response }) => {
    console.log("Received response:", response.status);
    return response;
  },
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Type không được infer đúng**

   - Đảm bảo `@repo/api-gateway` đã được build
   - Check xem có import đúng type từ gateway không

2. **Authentication không hoạt động**

   - Verify tokens được set đúng cách
   - Check localStorage trong browser dev tools

3. **CORS errors**
   - Đảm bảo API Gateway có CORS configuration đúng
   - Check origin trong CORS settings

### Debug Mode

```typescript
// Enable debug logging
const debugClient = createApiClient({
  onError: ({ error, code, request }) => {
    console.error("API Error:", {
      url: request.url,
      method: request.method,
      status: code,
      error,
    });
  },
});
```

## 📝 Best Practices

1. **Always handle errors**

   ```typescript
   try {
     const result = await authClient.login(credentials);
     // Handle success
   } catch (error) {
     if (isApiError(error)) {
       // Handle API-specific errors
       console.error(`API Error [${error.status}]:`, error.message);
     } else {
       // Handle network/other errors
       console.error("Unexpected error:", error);
     }
   }
   ```

2. **Use React Query cho caching**

   ```typescript
   const { data, isLoading, error } = useQuery({
     queryKey: ["users", userId],
     queryFn: () => apiClient.users({ id: userId }).get(),
   });
   ```

3. **Implement token refresh logic**
   ```typescript
   // Auto-refresh tokens before expiry
   useEffect(() => {
     const tokens = getAuthTokens();
     if (tokens) {
       // Setup refresh timer
       const refreshTimer = setInterval(
         () => {
           authClient.refreshToken(tokens.refreshToken);
         },
         14 * 60 * 1000
       ); // Refresh every 14 minutes

       return () => clearInterval(refreshTimer);
     }
   }, []);
   ```

---

**Tài liệu này cung cấp hướng dẫn đầy đủ để sử dụng Eden Client package trong WIBUSYSTEM. Để biết thêm chi tiết, tham khảo [Eden Documentation](https://elysiajs.com/eden/overview.html).**
