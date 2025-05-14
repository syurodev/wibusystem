import {
  ApiAccessibilityEnum,
  // Permission, // Tạm thời comment nếu chưa dùng hoặc để tránh lỗi enum
  Role,
} from "../../enums";

import type {
  EndpointDetail,
  ServiceApiStaticLayout,
  VersionedResourceEndpointsGroup,
  VersionedServiceApiLayout,
} from "./_types";

export class NovelServiceApi {
  private readonly currentApiVersion: string;

  private static readonly layout: ServiceApiStaticLayout = {
    novels: {
      baseResource: "novels",
      endpoints: {
        GET_NOVEL_LIST: {
          method: "GET",
          subPath: "",
          description: "Lấy danh sách tiểu thuyết (có phân trang, filter).",
          accessibility: ApiAccessibilityEnum.OPTIONAL,
        },
        GET_NOVEL_DETAIL: {
          method: "GET",
          subPath: ":novelId",
          description: "Lấy chi tiết một tiểu thuyết.",
          accessibility: ApiAccessibilityEnum.OPTIONAL,
        },
        CREATE_NOVEL: {
          method: "POST",
          subPath: "",
          description: "Tạo mới một tiểu thuyết (yêu cầu quyền).",
          accessibility: ApiAccessibilityEnum.PROTECTED,
          requiredRoles: [Role.SYSTEM_ADMIN, Role.SUB_ADMIN],
          // requiredPermissions: [Permission.NOVEL_CREATE], // Ví dụ
        },
      },
    },
    chapters: {
      baseResource: "chapters",
      endpoints: {
        GET_NOVEL_CHAPTERS_FOR_NOVEL: {
          method: "GET",
          subPath: "by-novel/:novelId",
          description: "Lấy danh sách chương của một tiểu thuyết.",
          accessibility: ApiAccessibilityEnum.OPTIONAL,
        },
        GET_CHAPTER_DETAIL: {
          method: "GET",
          subPath: ":chapterId",
          description: "Lấy chi tiết nội dung một chương.",
          accessibility: ApiAccessibilityEnum.OPTIONAL,
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
      NovelServiceApi.layout
    )) {
      result[rgKey] = {
        baseResource: resourceGroup.baseResource,
        endpoints: resourceGroup.endpoints,
        apiVersion: this.currentApiVersion,
      };
    }
    return result as VersionedServiceApiLayout;
  }

  public getFullPath(
    resourceKey: keyof typeof NovelServiceApi.layout,
    endpointKey: string,
    apiPrefix: string = "/api"
  ): string | undefined {
    const resourceGroup = NovelServiceApi.layout[resourceKey];
    if (!resourceGroup) return undefined;

    const endpointDetail = resourceGroup.endpoints[endpointKey] as
      | EndpointDetail
      | undefined;
    if (!endpointDetail) return undefined;

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
