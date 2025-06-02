// API routes constants with authorization metadata

export type AuthRequirement = "none" | "optional" | "required";

export interface EndpointConfig {
  sub_path: string;
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
    PREFIX: "/auth",
    LOGIN: {
      sub_path: "/login",
      auth: "none",
      description: "User login endpoint",
    } as EndpointConfig,
    REGISTER: {
      sub_path: "/register",
      auth: "none",
      description: "User registration endpoint",
    } as EndpointConfig,
    LOGOUT: {
      sub_path: "/logout",
      auth: "required",
      description: "User logout endpoint",
    } as EndpointConfig,
    REFRESH: {
      sub_path: "/refresh",
      auth: "none",
      description: "Token refresh endpoint",
    } as EndpointConfig,
    PROFILE: {
      sub_path: "/profile",
      auth: "required",
      description: "User profile management",
    } as EndpointConfig,
  },
  USERS: {
    LIST: {
      sub_path: "",
      auth: "required",
      permissions: ["users:read"],
      description: "List all users",
    } as EndpointConfig,
    DETAIL: {
      sub_path: "/:id",
      auth: "required",
      permissions: ["users:read"],
      description: "Get user details",
    } as EndpointConfig,
    CREATE: {
      sub_path: "",
      auth: "required",
      permissions: ["users:create"],
      roles: ["admin", "manager"],
      description: "Create new user",
    } as EndpointConfig,
    UPDATE: {
      sub_path: "/:id",
      auth: "required",
      permissions: ["users:update"],
      description: "Update user information",
    } as EndpointConfig,
    DELETE: {
      sub_path: "/:id",
      auth: "required",
      permissions: ["users:delete"],
      roles: ["admin"],
      description: "Delete user",
    } as EndpointConfig,
  },
  ADMIN: {
    DASHBOARD: {
      sub_path: "/dashboard",
      auth: "required",
      roles: ["admin", "super_admin"],
      permissions: ["admin:read"],
      description: "Admin dashboard",
    } as EndpointConfig,
    USERS: {
      sub_path: "/users",
      auth: "required",
      roles: ["admin", "super_admin"],
      permissions: ["admin:users:manage"],
      description: "Admin user management",
    } as EndpointConfig,
    LOGS: {
      sub_path: "/logs",
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
  prefix: string,
  sub_path: string
): EndpointConfig | null {
  // Flatten all routes
  const allRoutes: EndpointConfig[] = [];

  Object.values(API_ROUTES).forEach((group) => {
    Object.values(group).forEach((route) => {
      if (typeof route !== "string") allRoutes.push(route);
    });
  });

  // Find matching route (support path parameters)
  return (
    allRoutes.find((route) => {
      const routePattern = prefix + route.sub_path.replace(/:[\w]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(prefix + sub_path);
    }) || null
  );
}

// Dynamic configuration helpers
export function getEndpointConfigWithCache(
  method: string,
  prefix: string,
  sub_path: string,
  cache: AuthorizationCache
): DynamicEndpointConfig | EndpointConfig | null {
  const cacheKey = `${method}:${prefix}:${sub_path}`;

  // Check cache first
  if (cache.endpoints.has(cacheKey)) {
    const cachedConfig = cache.endpoints.get(cacheKey)!;
    if (cachedConfig.isActive) {
      return cachedConfig;
    }
  }

  // Fallback to static config
  return getEndpointConfig(method, prefix, sub_path);
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
