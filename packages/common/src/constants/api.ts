// API routes constants with authorization metadata

export type AuthRequirement = "none" | "optional" | "required";

export interface EndpointConfig {
  path: string;
  auth: AuthRequirement;
  roles?: string[];
  permissions?: string[];
  description?: string;
}

// Database-driven authorization config
export interface DynamicEndpointConfig extends EndpointConfig {
  id: string;
  method: string;
  service: string;
  isActive: boolean;
  priority: number; // Higher priority overrides lower
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthorizationCache {
  endpoints: Map<string, DynamicEndpointConfig>;
  lastUpdated: Date;
  ttl: number; // Time to live in milliseconds
}

export const API_ROUTES = {
  AUTH: {
    LOGIN: {
      path: "/auth/login",
      auth: "none",
      description: "User login endpoint",
    } as EndpointConfig,
    REGISTER: {
      path: "/auth/register",
      auth: "none",
      description: "User registration endpoint",
    } as EndpointConfig,
    LOGOUT: {
      path: "/auth/logout",
      auth: "required",
      description: "User logout endpoint",
    } as EndpointConfig,
    REFRESH: {
      path: "/auth/refresh",
      auth: "none",
      description: "Token refresh endpoint",
    } as EndpointConfig,
    PROFILE: {
      path: "/auth/profile",
      auth: "required",
      description: "User profile management",
    } as EndpointConfig,
  },
  USERS: {
    LIST: {
      path: "/users",
      auth: "required",
      permissions: ["users:read"],
      description: "List all users",
    } as EndpointConfig,
    DETAIL: {
      path: "/users/:id",
      auth: "required",
      permissions: ["users:read"],
      description: "Get user details",
    } as EndpointConfig,
    CREATE: {
      path: "/users",
      auth: "required",
      permissions: ["users:create"],
      roles: ["admin", "manager"],
      description: "Create new user",
    } as EndpointConfig,
    UPDATE: {
      path: "/users/:id",
      auth: "required",
      permissions: ["users:update"],
      description: "Update user information",
    } as EndpointConfig,
    DELETE: {
      path: "/users/:id",
      auth: "required",
      permissions: ["users:delete"],
      roles: ["admin"],
      description: "Delete user",
    } as EndpointConfig,
  },
  ADMIN: {
    DASHBOARD: {
      path: "/admin/dashboard",
      auth: "required",
      roles: ["admin", "super_admin"],
      permissions: ["admin:read"],
      description: "Admin dashboard",
    } as EndpointConfig,
    USERS: {
      path: "/admin/users",
      auth: "required",
      roles: ["admin", "super_admin"],
      permissions: ["admin:users:manage"],
      description: "Admin user management",
    } as EndpointConfig,
    LOGS: {
      path: "/admin/logs",
      auth: "required",
      roles: ["admin", "super_admin"],
      permissions: ["admin:logs:read"],
      description: "System logs access",
    } as EndpointConfig,
  },
} as const;

// Helper functions
export function getEndpointConfig(
  method: string,
  path: string
): EndpointConfig | null {
  // Flatten all routes
  const allRoutes: EndpointConfig[] = [];

  Object.values(API_ROUTES).forEach((group) => {
    Object.values(group).forEach((route) => {
      allRoutes.push(route);
    });
  });

  // Find matching route (support path parameters)
  return (
    allRoutes.find((route) => {
      const routePattern = route.path.replace(/:[\w]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    }) || null
  );
}

// Dynamic configuration helpers
export function getEndpointConfigWithCache(
  method: string,
  path: string,
  cache: AuthorizationCache
): DynamicEndpointConfig | EndpointConfig | null {
  const cacheKey = `${method}:${path}`;

  // Check cache first
  if (cache.endpoints.has(cacheKey)) {
    const cachedConfig = cache.endpoints.get(cacheKey)!;
    if (cachedConfig.isActive) {
      return cachedConfig;
    }
  }

  // Fallback to static config
  return getEndpointConfig(method, path);
}

export function checkPermissions(
  userRoles: string[],
  userPermissions: string[],
  requiredRoles?: string[],
  requiredPermissions?: string[]
): boolean {
  // Check roles
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    if (!hasRole) return false;
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasPermission) return false;
  }

  return true;
}
