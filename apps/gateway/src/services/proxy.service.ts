import { SERVICE_CONFIG } from "../configs";

export interface ProxyRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
}

/**
 * Service để xử lý reverse proxy requests
 */
export class ProxyService {
  /**
   * Lấy service config dựa trên project ID
   */
  private getServiceConfig(projectId: string) {
    const service = SERVICE_CONFIG.SERVICES[projectId];
    if (!service) {
      throw new Error(`Service not found for project ID: ${projectId}`);
    }
    return service;
  }

  /**
   * Tạo target URL cho service
   */
  private buildTargetUrl(projectId: string, originalUrl: string): string {
    const service = this.getServiceConfig(projectId);
    const protocol = "http"; // Có thể config thêm HTTPS sau

    // Remove leading slash nếu có
    const path = originalUrl.startsWith("/")
      ? originalUrl.slice(1)
      : originalUrl;

    return `${protocol}://${service.host}:${service.port}/${path}`;
  }

  /**
   * Forward request đến target service
   */
  async forwardRequest(
    projectId: string,
    request: ProxyRequest
  ): Promise<ProxyResponse> {
    try {
      const targetUrl = this.buildTargetUrl(projectId, request.url);

      // Loại bỏ các headers không cần thiết
      const forwardHeaders = { ...request.headers };
      delete forwardHeaders["host"];
      delete forwardHeaders["content-length"];

      console.log(
        `🔄 Forwarding ${request.method} ${request.url} -> ${targetUrl}`
      );

      const response = await fetch(targetUrl, {
        method: request.method,
        headers: forwardHeaders,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      // Đọc response
      const responseText = await response.text();
      let responseBody;

      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }

      // Tạo response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return {
        status: response.status,
        headers: responseHeaders,
        body: responseBody,
      };
    } catch (error) {
      console.error(`❌ Proxy error for project ${projectId}:`, error);
      throw new Error(
        `Failed to proxy request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Validate project ID
   */
  validateProjectId(projectId: string): boolean {
    return projectId in SERVICE_CONFIG.SERVICES;
  }

  /**
   * Lấy danh sách available services
   */
  getAvailableServices() {
    return Object.entries(SERVICE_CONFIG.SERVICES).map(([id, config]) => ({
      projectId: id,
      name: config.name,
      endpoint: `${config.host}:${config.port}`,
    }));
  }
}
