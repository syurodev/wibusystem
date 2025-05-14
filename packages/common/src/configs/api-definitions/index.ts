import type {
  EndpointDetail,
  ResourceEndpointsGroup,
  // --- Core Static Types (used by API class definitions) ---
  ServiceApiStaticLayout,
  VersionedResourceEndpointsGroup, // Detail của từng endpoint lá

  // --- Versioned Types (returned by class methods like getDefinition()) ---
  VersionedServiceApiLayout,
} from "./_types";
import { AuthServiceApi } from "./auth-service.api";
import { NovelServiceApi } from "./novel-service.api";

// 1. Export các class API trực tiếp
export { AuthServiceApi, NovelServiceApi };

// 2. Export các kiểu Type cốt lõi để người dùng có thể type hint khi cần
export type {
  EndpointDetail,
  ResourceEndpointsGroup,
  ServiceApiStaticLayout,
  VersionedResourceEndpointsGroup,
  VersionedServiceApiLayout,
};

/**
 * 3. Một factory function tiện ích để tạo instance của các API class.
 * Điều này giúp tránh việc phải import từng class API riêng lẻ ở nơi sử dụng.
 * Lưu ý: Type `T` (union của các typeof ApiClass) cần được mở rộng khi bạn thêm class API mới.
 */
export type ApiServiceClassType =
  | typeof AuthServiceApi
  | typeof NovelServiceApi; // Helper type

export function getApiService<T extends ApiServiceClassType>(
  ApiServiceClass: T,
  apiVersion?: string
): InstanceType<T> {
  return new ApiServiceClass(apiVersion) as InstanceType<T>;
}
