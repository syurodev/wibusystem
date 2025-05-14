import { ApiAccessibilityEnum, Permission, Role } from "../../enums"; // Giả sử các enums được export qua index.ts của thư mục enums

import type {
  EndpointDetail,
  ServiceApiStaticLayout,
  VersionedResourceEndpointsGroup,
  VersionedServiceApiLayout,
} from "./_types";

export class AuthServiceApi {
  private readonly currentApiVersion: string;

  private static readonly layout: ServiceApiStaticLayout = {
    auth: {
      baseResource: "auth",
      endpoints: {
        AUTH_REGISTER: {
          method: "POST",
          subPath: "register",
          description: "Đăng ký người dùng mới.",
          accessibility: ApiAccessibilityEnum.PUBLIC,
        },
        AUTH_LOGIN: {
          method: "POST",
          subPath: "login",
          description: "Đăng nhập người dùng.",
          accessibility: ApiAccessibilityEnum.PUBLIC,
        },
        AUTH_REFRESH_TOKEN: {
          method: "POST",
          subPath: "refresh-token",
          description: "Làm mới access token.",
          accessibility: ApiAccessibilityEnum.PUBLIC,
        },
        AUTH_LOGOUT: {
          method: "POST",
          subPath: "logout",
          description: "Đăng xuất người dùng.",
          accessibility: ApiAccessibilityEnum.PROTECTED,
        },
        AUTH_FORGOT_PASSWORD: {
          method: "POST",
          subPath: "forgot-password",
          description: "Yêu cầu reset mật khẩu.",
          accessibility: ApiAccessibilityEnum.PUBLIC,
        },
        AUTH_RESET_PASSWORD: {
          method: "POST",
          subPath: "reset-password",
          description: "Đặt lại mật khẩu mới.",
          accessibility: ApiAccessibilityEnum.PUBLIC,
        },
      },
    },
    users: {
      baseResource: "users",
      endpoints: {
        GET_USER_PROFILE_ME: {
          method: "GET",
          subPath: "me",
          description: "Lấy thông tin cá nhân của người dùng đang đăng nhập.",
          accessibility: ApiAccessibilityEnum.PROTECTED,
          requiredRoles: [], // Bạn đã sửa thành mảng rỗng
          requiredPermissions: [Permission.USER_VIEW], // Bạn đã sửa thành USER_VIEW
        },
        UPDATE_USER_PROFILE_ME: {
          method: "PUT",
          subPath: "me",
          description:
            "Cập nhật thông tin cá nhân của người dùng đang đăng nhập.",
          accessibility: ApiAccessibilityEnum.PROTECTED,
          requiredRoles: [Role.USER, Role.SYSTEM_ADMIN, Role.SUB_ADMIN], // Các role bạn đã sửa
          requiredPermissions: [Permission.FULL_ACCESS, Permission.USER_MANAGE], // Các permission bạn đã sửa
        },
      },
    },
    sessions: {
      baseResource: "sessions",
      endpoints: {
        GET_USER_SESSIONS: {
          method: "GET",
          subPath: "",
          description: "Lấy danh sách phiên đăng nhập của người dùng.",
          accessibility: ApiAccessibilityEnum.PROTECTED,
          requiredRoles: [Role.USER, Role.SYSTEM_ADMIN, Role.SUB_ADMIN],
        },
        REVOKE_USER_SESSION: {
          method: "DELETE",
          subPath: ":sessionId",
          description: "Thu hồi một phiên đăng nhập cụ thể.",
          accessibility: ApiAccessibilityEnum.PROTECTED,
          requiredRoles: [Role.USER, Role.SYSTEM_ADMIN, Role.SUB_ADMIN],
        },
        REVOKE_ALL_OTHER_SESSIONS: {
          method: "DELETE",
          subPath: "all-others",
          description:
            "Thu hồi tất cả các phiên đăng nhập khác của người dùng.",
          accessibility: ApiAccessibilityEnum.PROTECTED,
          requiredRoles: [Role.USER, Role.SYSTEM_ADMIN, Role.SUB_ADMIN],
        },
      },
    },
  };

  constructor(apiVersion: string = "v1") {
    this.currentApiVersion = apiVersion;
  }

  public getDefinition(): VersionedServiceApiLayout {
    const result: Record<string, VersionedResourceEndpointsGroup> = {};
    for (const [rgKey, resourceGroup] of Object.entries(
      AuthServiceApi.layout
    )) {
      result[rgKey] = {
        baseResource: resourceGroup.baseResource,
        endpoints: resourceGroup.endpoints,
        apiVersion: this.currentApiVersion,
      };
    }
    return result as VersionedServiceApiLayout;
  }

  public getFullPath<RK extends keyof typeof AuthServiceApi.layout>(
    resourceKey: RK,
    endpointKey: keyof (typeof AuthServiceApi.layout)[RK]["endpoints"],
    apiPrefix: string = "/api"
  ): string {
    const resourceGroup = AuthServiceApi.layout[resourceKey]!;
    // resourceGroup chắc chắn tồn tại vì RK là một key của layout và chúng ta đã dùng non-null assertion

    const endpointDetail = resourceGroup.endpoints[
      endpointKey as string
    ] as EndpointDetail;
    // endpointDetail cũng chắc chắn tồn tại do type safety của endpointKey

    let path = `${apiPrefix}/${this.currentApiVersion}/${resourceGroup.baseResource}`;
    if (endpointDetail.subPath && endpointDetail.subPath !== "/") {
      const cleanSubPath = endpointDetail.subPath.startsWith("/")
        ? endpointDetail.subPath.substring(1)
        : endpointDetail.subPath;
      if (cleanSubPath) path += `/${cleanSubPath}`;
    }
    return path.replace(/\/\/+/g, "/");
  }
}
