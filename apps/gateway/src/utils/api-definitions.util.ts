import {
  ApiAccessibilityEnum,
  AuthServiceApi,
  EndpointDetail,
  NovelServiceApi,
  VersionedServiceApiLayout,
  getApiService
} from '@repo/common';

/**
 * Cache các API definition để tránh phải tạo mới mỗi lần
 */
const apiDefinitionsCache = new Map<string, VersionedServiceApiLayout>();

/**
 * Lấy API definition cho service chỉ định
 * @param serviceName Tên service (auth, novel, ...)
 * @returns API definition đã được version hóa
 */
export function getApiDefinition(serviceName: 'auth' | 'novel'): VersionedServiceApiLayout {
  if (apiDefinitionsCache.has(serviceName)) {
    return apiDefinitionsCache.get(serviceName)!;
  }

  let apiDefinition: VersionedServiceApiLayout;

  switch (serviceName) {
    case 'auth':
      apiDefinition = getApiService(AuthServiceApi).getDefinition();
      break;
    case 'novel':
      apiDefinition = getApiService(NovelServiceApi).getDefinition();
      break;
    default:
      throw new Error(`Unknown service: ${serviceName}`);
  }

  apiDefinitionsCache.set(serviceName, apiDefinition);
  return apiDefinition;
}

/**
 * Tìm endpoint detail dựa trên path và method
 * @param serviceName Tên service (auth, novel, ...)
 * @param path Đường dẫn endpoint
 * @param method HTTP method
 * @returns Endpoint detail hoặc undefined nếu không tìm thấy
 */
export function findEndpointDetail(
  serviceName: 'auth' | 'novel',
  path: string,
  method: string
): EndpointDetail | undefined {
  const apiDefinition = getApiDefinition(serviceName);
  
  // Đường dẫn có thể có định dạng: /auth/login, auth/login, login
  // Chuẩn hóa đường dẫn: bỏ "/" ở đầu và chia thành các phần
  const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
  const pathParts = normalizedPath.split('/');
  
  // Nếu path bắt đầu với tên service, bỏ qua phần đầu
  const resourcePath = pathParts[0] === serviceName
    ? pathParts.slice(1).join('/')
    : normalizedPath;

  // Kiểm tra từng nhóm resource
  for (const resourceGroup of Object.values(apiDefinition)) {
    // Kiểm tra từng endpoint trong nhóm
    for (const endpoint of Object.values(resourceGroup.endpoints)) {
      // Kiểm tra method và path khớp
      const subPath = endpoint.subPath;
      if (endpoint.method === method.toUpperCase() && 
          (resourcePath === subPath || 
           matchDynamicPath(resourcePath, subPath))) {
        return endpoint;
      }
    }
  }
  
  return undefined;
}

/**
 * Kiểm tra xem path có khớp với pattern động hay không
 * Ví dụ: "users/123" khớp với "users/:id"
 * @param actualPath Đường dẫn thực tế
 * @param patternPath Mẫu đường dẫn có thể chứa tham số động (:param)
 * @returns true nếu khớp, false nếu không
 */
function matchDynamicPath(actualPath: string, patternPath: string): boolean {
  const actualParts = actualPath.split('/');
  const patternParts = patternPath.split('/');
  
  if (actualParts.length !== patternParts.length) {
    return false;
  }
  
  for (let i = 0; i < patternParts.length; i++) {
    // Nếu là tham số động (bắt đầu bằng :), luôn khớp
    if (patternParts[i].startsWith(':')) {
      continue;
    }
    
    // Nếu không phải tham số động, phải khớp chính xác
    if (patternParts[i] !== actualParts[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Kiểm tra xem endpoint có yêu cầu xác thực hay không
 * @param endpoint Thông tin endpoint
 * @returns true nếu cần xác thực, false nếu không
 */
export function isAuthRequired(endpoint: EndpointDetail): boolean {
  return endpoint.accessibility === ApiAccessibilityEnum.PROTECTED;
}

/**
 * Kiểm tra xem người dùng có quyền truy cập endpoint hay không
 * @param endpoint Thông tin endpoint
 * @param userRoles Danh sách vai trò của người dùng
 * @param userPermissions Danh sách quyền của người dùng
 * @returns true nếu có quyền, false nếu không
 */
export function hasAccess(
  endpoint: EndpointDetail,
  userRoles: string[],
  userPermissions: string[]
): boolean {
  // Nếu endpoint không yêu cầu vai trò hoặc quyền cụ thể, cho phép truy cập
  if (!endpoint.requiredRoles?.length && !endpoint.requiredPermissions?.length) {
    return true;
  }
  
  // Kiểm tra vai trò
  if (endpoint.requiredRoles?.length) {
    const hasRequiredRole = userRoles.some(role => 
      endpoint.requiredRoles?.includes(role as any)
    );
    
    if (hasRequiredRole) {
      return true;
    }
  }
  
  // Kiểm tra quyền
  if (endpoint.requiredPermissions?.length) {
    const hasRequiredPermission = userPermissions.some(permission => 
      endpoint.requiredPermissions?.includes(permission as any)
    );
    
    if (hasRequiredPermission) {
      return true;
    }
  }
  
  return false;
}
