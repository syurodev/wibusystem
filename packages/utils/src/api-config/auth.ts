import { API_SECURITY } from "@repo/types";

export namespace AuthApiConfig {
  // Service prefix cho BE
  export const PREFIX = "/auth";
  const DEFAULT_VERSION = "v1";

  // Function để tạo API prefix với version động
  export function getApiPrefix(version: string = DEFAULT_VERSION): string {
    return `/api/${version}${PREFIX}`;
  }

  // Default API prefix (backward compatibility)
  export const API_PREFIX = getApiPrefix();

  // Routes definition - BE sử dụng để define routes
  export const ROUTES = {
    // Device routes
    "POST /device/token": {
      id: "auth.device.register",
      path: "/device/token",
      method: "POST",
      security: API_SECURITY.NONE,
      roles: [],
      permissions: [],
    },
    "POST /device/verify": {
      id: "auth.device.verify",
      path: "/device/verify",
      method: "POST",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    "POST /device/link": {
      id: "auth.device.link",
      path: "/device/link",
      method: "POST",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    "POST /device/:id/delete": {
      id: "auth.device.delete",
      path: "/device/:id/delete",
      method: "POST",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    "GET /device/list": {
      id: "auth.device.list",
      path: "/device/list",
      method: "GET",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    // Auth routes
    "POST /register": {
      id: "auth.register",
      path: "/register",
      method: "POST",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    "POST /login": {
      id: "auth.login",
      path: "/login",
      method: "POST",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    "POST /logout": {
      id: "auth.logout",
      path: "/logout",
      method: "POST",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
    "POST /refresh": {
      id: "auth.refresh",
      path: "/refresh",
      method: "POST",
      security: "REFRESH_TOKEN_REQUIRED",
      roles: [],
      permissions: [],
    },
    "GET /verify": {
      id: "auth.verify",
      path: "/verify",
      method: "GET",
      security: API_SECURITY.TOKEN_REQUIRED,
      roles: [],
      permissions: [],
    },
  } as const;

  // Helper functions cho FE - tạo URL với params và API ID
  export function getDeviceRegisterUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/device/token`,
      apiId: "auth.device.register",
    };
  }

  export function getDeviceVerifyUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/device/verify`,
      apiId: "auth.device.verify",
    };
  }

  export function getDeviceLinkUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/device/link`,
      apiId: "auth.device.link",
    };
  }

  export function getDeleteDeviceUrl(id: number, version?: string) {
    return {
      url: `${getApiPrefix(version)}/device/${id}/delete`,
      apiId: "auth.device.delete",
    };
  }

  export function getDeviceListUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/device/list`,
      apiId: "auth.device.list",
    };
  }

  export function getRegisterUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/register`,
      apiId: "auth.register",
    };
  }

  export function getLoginUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/login`,
      apiId: "auth.login",
    };
  }

  export function getLogoutUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/logout`,
      apiId: "auth.logout",
    };
  }

  export function getRefreshUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/refresh`,
      apiId: "auth.refresh",
    };
  }

  export function getVerifyUrl(version?: string) {
    return {
      url: `${getApiPrefix(version)}/verify`,
      apiId: "auth.verify",
    };
  }

  // API IDs mapping để Gateway lookup nhanh
  export const API_IDS = Object.fromEntries(
    Object.entries(ROUTES).map(([_, config]) => [config.id, config])
  );

  // Gateway helper - lấy config bằng API ID (recommend)
  export function getRouteConfigById(apiId: string): {
    id: string;
    path: string;
    method: string;
    security: string;
  } | null {
    return API_IDS[apiId] || null;
  }

  // BE helper - lấy tất cả paths cho route registration
  export function getAllPaths(version?: string): Array<{
    method: string;
    path: string;
    fullPath: string;
    security: string;
  }> {
    const apiPrefix = getApiPrefix(version);
    return Object.entries(ROUTES).map(([routeKey, config]) => {
      const [method] = routeKey.split(" ");
      return {
        method: method || "GET",
        path: config.path,
        fullPath: `${apiPrefix}${config.path}`,
        security: config.security,
      };
    });
  }
}
