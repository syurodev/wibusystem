import { type ApiAccessibilityEnum } from "../../enums/api-accessibility.enum";
import { type Permission } from "../../enums/permissions.enum";
import { type Role } from "../../enums/roles.enum";

/**
 * Thông tin chi tiết của một endpoint cụ thể,
 * không bao gồm các thông tin ngữ cảnh như id, service, apiVersion, baseResource
 * vì chúng sẽ được xác định hoặc cung cấp bởi class API service.
 */
export interface EndpointDetail {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  subPath: string; // Phần còn lại của path, ví dụ: "register", "me", ":itemId"
  description?: string;
  accessibility: ApiAccessibilityEnum;
  requiredRoles?: Role[];
  requiredPermissions?: Permission[];
  // Các metadata khác dành riêng cho endpoint (nếu có)
}

/**
 * Cấu trúc tĩnh cho một nhóm các endpoint thuộc về một baseResource cụ thể.
 * Không chứa apiVersion vì nó sẽ được áp dụng bởi instance của API class.
 */
export interface ResourceEndpointsGroup {
  readonly baseResource: string;
  readonly endpoints: {
    // Key ở đây chính là ID của endpoint, ví dụ: "AUTH_REGISTER"
    readonly [endpointKey: string]: EndpointDetail;
  };
}

/**
 * Cấu trúc tĩnh đầy đủ cho layout API của một service,
 * bao gồm nhiều ResourceEndpointsGroup.
 */
export interface ServiceApiStaticLayout {
  // Key ở đây là tên của nhóm resource, ví dụ: "auth", "users".
  readonly [resourceGroupKey: string]: ResourceEndpointsGroup;
}

// --- Các kiểu dữ liệu đã được "phiên bản hóa" (có apiVersion) ---

/**
 * ResourceEndpointsGroup sau khi đã được gán một apiVersion cụ thể.
 */
export interface VersionedResourceEndpointsGroup
  extends ResourceEndpointsGroup {
  readonly apiVersion: string;
}

/**
 * ServiceApiStaticLayout sau khi tất cả các ResourceEndpointsGroup bên trong
 * đã được "phiên bản hóa" với một apiVersion cụ thể.
 * Đây là kiểu dữ liệu mà phương thức getDefinition() của API class sẽ trả về.
 */
export interface VersionedServiceApiLayout {
  // Key ở đây là tên của nhóm resource, ví dụ: "auth", "users".
  readonly [resourceGroupKey: string]: VersionedResourceEndpointsGroup;
}
