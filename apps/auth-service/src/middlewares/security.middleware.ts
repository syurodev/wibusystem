/**
 * Security Middleware cho Auth Service
 * Bao gồm rate limiting, security headers, và monitoring cho internal microservice
 */

import { Elysia } from "elysia";
import { APP_CONFIG } from "../configs/env";

// Rate limiting store (in-memory for now, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting middleware
 */
export const rateLimitMiddleware = (
  options: {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (request: Request) => string;
  } = {
    windowMs: APP_CONFIG.RATE_LIMIT_WINDOW_MS,
    maxRequests: APP_CONFIG.RATE_LIMIT_MAX_REQUESTS,
  }
) => {
  return new Elysia().derive(({ request, set }) => {
    const key = options.keyGenerator
      ? options.keyGenerator(request)
      : request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < windowStart) {
      entry = { count: 0, resetTime: now + options.windowMs };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= options.maxRequests) {
      set.status = 429;
      set.headers["X-RateLimit-Limit"] = options.maxRequests.toString();
      set.headers["X-RateLimit-Remaining"] = "0";
      set.headers["X-RateLimit-Reset"] = entry.resetTime.toString();
      set.headers["Retry-After"] = Math.ceil(
        (entry.resetTime - now) / 1000
      ).toString();

      throw new Error("Too Many Requests");
    }

    // Increment counter
    entry.count++;

    // Set rate limit headers
    set.headers["X-RateLimit-Limit"] = options.maxRequests.toString();
    set.headers["X-RateLimit-Remaining"] = (
      options.maxRequests - entry.count
    ).toString();
    set.headers["X-RateLimit-Reset"] = entry.resetTime.toString();

    return { rateLimitKey: key };
  });
};

/**
 * Security headers middleware cho internal service
 */
export const securityHeadersMiddleware = () => {
  return new Elysia().onBeforeHandle(({ set }) => {
    // Basic security headers
    set.headers["X-Content-Type-Options"] = "nosniff";
    set.headers["X-Frame-Options"] = "DENY";
    set.headers["X-XSS-Protection"] = "1; mode=block";
    set.headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

    // Service identification
    set.headers["X-Service-Name"] = APP_CONFIG.SERVICE_NAME;
    set.headers["X-Service-Version"] = APP_CONFIG.SERVICE_VERSION;

    // Internal service indicator
    set.headers["X-Service-Type"] = "internal";
  });
};

/**
 * Request logging middleware
 */
export const requestLoggingMiddleware = () => {
  return new Elysia()
    .onBeforeHandle(({ request }) => {
      const startTime = Date.now();

      // Store start time for duration calculation
      (request as any).__startTime = startTime;

      // Log request start
      if (APP_CONFIG.LOG_LEVEL === "debug") {
        console.log(
          `📨 ${request.method} ${new URL(request.url).pathname} - Start`
        );
      }
    })
    .onAfterHandle(({ request, response, set }) => {
      const duration = Date.now() - ((request as any).__startTime || 0);
      const url = new URL(request.url);
      const userAgent = request.headers.get("user-agent") || "unknown";
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // Log request completion
      console.log(
        `✅ ${request.method} ${url.pathname} ${set.status || 200} ${duration}ms ${ip} "${userAgent}"`
      );

      // Set performance headers
      set.headers["X-Response-Time"] = `${duration}ms`;
      set.headers["X-Request-ID"] = crypto.randomUUID();

      return response;
    })
    .onError(({ request, error, set }) => {
      const duration = Date.now() - ((request as any).__startTime || 0);
      const url = new URL(request.url);
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";

      // Safely get error message
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      // Log error
      console.error(
        `❌ ${request.method} ${url.pathname} ${set.status || 500} ${duration}ms ${ip} - ${errorMessage}`
      );

      // Don't expose internal errors in production
      if (APP_CONFIG.NODE_ENV === "production") {
        set.status = set.status || 500;
        return {
          success: false,
          error:
            set.status === 429 ? "Too Many Requests" : "Internal Server Error",
          code: set.status === 429 ? "RATE_LIMIT_EXCEEDED" : "INTERNAL_ERROR",
          request_id: crypto.randomUUID(),
        };
      }

      return {
        success: false,
        error: errorMessage,
        code: "ERROR",
        stack: errorStack,
      };
    });
};

/**
 * Device-specific rate limiting
 */
export const deviceRateLimitMiddleware = () => {
  return rateLimitMiddleware({
    windowMs: 60000, // 1 minute
    maxRequests: APP_CONFIG.RATE_LIMIT_DEVICE_REGISTRATION,
    keyGenerator: (request) => {
      const deviceId = request.headers.get("x-device-id");
      const ip =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      return `device:${deviceId || ip}`;
    },
  });
};

/**
 * Health check middleware (bypass security for monitoring)
 */
export const healthCheckMiddleware = () => {
  return new Elysia()
    .get("/health", () => ({
      status: "healthy",
      service: APP_CONFIG.SERVICE_NAME,
      version: APP_CONFIG.SERVICE_VERSION,
      environment: APP_CONFIG.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      type: "internal-microservice",
    }))
    .get("/metrics", () => {
      if (!APP_CONFIG.ENABLE_METRICS) {
        return { error: "Metrics disabled" };
      }

      return {
        service: APP_CONFIG.SERVICE_NAME,
        version: APP_CONFIG.SERVICE_VERSION,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        rate_limit_store_size: rateLimitStore.size,
        environment: APP_CONFIG.NODE_ENV,
        timestamp: new Date().toISOString(),
        type: "internal-microservice",
      };
    });
};

/**
 * Complete security middleware stack cho internal microservice
 * Không bao gồm CORS vì gateway sẽ xử lý
 */
export const securityMiddlewareStack = () => {
  return new Elysia()
    .use(healthCheckMiddleware())
    .use(securityHeadersMiddleware())
    .use(requestLoggingMiddleware())
    .use(rateLimitMiddleware());
};

/**
 * Cleanup function for rate limiting store (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired rate limit entries`);
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
