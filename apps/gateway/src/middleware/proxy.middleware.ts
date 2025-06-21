import { Context } from "elysia";
import { ProxyRequest, ProxyService } from "../services/proxy.service";

/**
 * Middleware để xử lý reverse proxy dựa trên x-project-id header
 */
export class ProxyMiddleware {
  private proxyService: ProxyService;

  constructor() {
    this.proxyService = new ProxyService();
  }

  /**
   * Extract project ID từ headers
   */
  private extractProjectId(headers: Record<string, string>): string | null {
    // Tìm header x-project-id (case-insensitive)
    const projectIdHeader = Object.keys(headers).find(
      (key) => key.toLowerCase() === "x-project-id"
    );

    return projectIdHeader ? headers[projectIdHeader] : null;
  }

  /**
   * Convert Elysia context sang ProxyRequest format
   */
  private async buildProxyRequest(ctx: Context): Promise<ProxyRequest> {
    const headers: Record<string, string> = {};

    // Extract headers từ request
    if (ctx.request.headers) {
      ctx.request.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }

    // Get request body nếu có
    let body = undefined;
    if (ctx.request.body && ctx.body) {
      body = ctx.body;
    }

    return {
      method: ctx.request.method,
      url: new URL(ctx.request.url).pathname + new URL(ctx.request.url).search,
      headers,
      body,
    };
  }

  /**
   * Main proxy handler
   */
  async handleProxy(ctx: Context) {
    try {
      const request = await this.buildProxyRequest(ctx);
      const projectId = this.extractProjectId(request.headers);

      // Kiểm tra project ID
      if (!projectId) {
        return new Response(
          JSON.stringify({
            error: "Missing x-project-id header",
            message: "Please provide x-project-id header to route your request",
            availableServices: this.proxyService.getAvailableServices(),
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate project ID
      if (!this.proxyService.validateProjectId(projectId)) {
        return new Response(
          JSON.stringify({
            error: "Invalid project ID",
            message: `Project ID '${projectId}' is not supported`,
            availableServices: this.proxyService.getAvailableServices(),
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Forward request
      const proxyResponse = await this.proxyService.forwardRequest(
        projectId,
        request
      );

      // Return proxied response
      return new Response(
        typeof proxyResponse.body === "string"
          ? proxyResponse.body
          : JSON.stringify(proxyResponse.body),
        {
          status: proxyResponse.status,
          headers: {
            ...proxyResponse.headers,
            "X-Proxied-By": "gateway",
            "X-Target-Service": projectId,
          },
        }
      );
    } catch (error) {
      console.error("❌ Proxy middleware error:", error);

      return new Response(
        JSON.stringify({
          error: "Proxy Error",
          message:
            error instanceof Error ? error.message : "Unknown proxy error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}
