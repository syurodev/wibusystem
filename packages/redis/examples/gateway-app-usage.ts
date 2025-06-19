import {
  CacheManager,
  RateLimiter,
  RedisClient,
  SocketAdapter,
} from "@repo/redis";

/**
 * Example sử dụng Redis package trong Gateway App
 * Demonstrates rate limiting, lock mechanisms for request deduplication, and response caching
 */

interface RequestMetadata {
  id: string;
  method: string;
  path: string;
  userId?: string;
  ip: string;
  timestamp: number;
}

interface CachedResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  cachedAt: number;
}

class GatewayService {
  private redis: RedisClient;
  private rateLimiter: RateLimiter;
  private socketAdapter: SocketAdapter;
  private cache: CacheManager;

  constructor() {
    this.redis = new RedisClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      maxConnections: 50, // Gateway cần nhiều connections
    });

    this.rateLimiter = new RateLimiter(this.redis, {
      prefix: "gateway:limit:",
      windowMs: 60000, // 1 minute default
    });

    this.socketAdapter = new SocketAdapter(this.redis, {
      lockPrefix: "gateway:lock:",
      channelPrefix: "gateway:events:",
    });

    this.cache = new CacheManager(this.redis, {
      namespace: "gateway:cache:",
      ttl: 300, // 5 minutes default
    });
  }

  /**
   * Rate limit requests per IP
   */
  async checkIPRateLimit(ip: string): Promise<boolean> {
    const result = await this.rateLimiter.checkLimit(
      `ip:${ip}`,
      1000, // 1000 requests
      60000 // per minute
    );

    return !result.limited;
  }

  /**
   * Rate limit requests per user
   */
  async checkUserRateLimit(userId: string): Promise<boolean> {
    const result = await this.rateLimiter.checkLimit(
      `user:${userId}`,
      500, // 500 requests
      60000 // per minute
    );

    return !result.limited;
  }

  /**
   * Rate limit per API endpoint
   */
  async checkEndpointRateLimit(endpoint: string): Promise<boolean> {
    const result = await this.rateLimiter.checkLimit(
      `endpoint:${endpoint}`,
      10000, // 10k requests
      60000 // per minute
    );

    return !result.limited;
  }

  /**
   * Prevent duplicate expensive requests using locks
   */
  async handleRequestWithDeduplication<T>(
    requestId: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const lockKey = `request:${requestId}`;

    // Try to acquire lock
    const lockId = await this.socketAdapter.acquireLock(lockKey, 30000, {
      maxRetries: 0, // Don't retry, fail fast
      retryDelay: 0,
    });

    if (!lockId) {
      // Request is already being processed, wait for result
      console.log(
        `Request ${requestId} is already being processed, waiting...`
      );

      // Poll for result (in real app, you might use pub/sub)
      return await this.waitForRequestResult<T>(requestId);
    }

    try {
      console.log(`Processing request ${requestId}`);
      const result = await handler();

      // Cache result for others waiting
      await this.cache.set(`result:${requestId}`, result, 60);

      return result;
    } finally {
      await this.socketAdapter.releaseLock(lockKey, lockId);
    }
  }

  /**
   * Cache GET responses
   */
  async getCachedResponse(cacheKey: string): Promise<CachedResponse | null> {
    return await this.cache.get<CachedResponse>(cacheKey);
  }

  /**
   * Cache response
   */
  async cacheResponse(
    cacheKey: string,
    response: CachedResponse,
    ttl: number = 300
  ): Promise<void> {
    await this.cache.set(
      cacheKey,
      {
        ...response,
        cachedAt: Date.now(),
      },
      ttl
    );
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateCachePattern(pattern: string): Promise<number> {
    // In real implementation, you'd use SCAN with pattern
    // For demo, we'll simulate invalidating user-specific caches
    const keysToDelete = [
      `user:${pattern}:profile`,
      `user:${pattern}:permissions`,
      `user:${pattern}:dashboard`,
    ];

    let deleted = 0;
    for (const key of keysToDelete) {
      const wasDeleted = await this.cache.del(key);
      if (wasDeleted) deleted++;
    }

    return deleted;
  }

  /**
   * Check if request should be blocked (circuit breaker pattern)
   */
  async checkCircuitBreaker(service: string): Promise<boolean> {
    const errorKey = `errors:${service}`;
    const current = await this.redis.get(errorKey);
    const errorCount = current ? parseInt(current, 10) : 0;

    // If more than 10 errors in last 5 minutes, circuit is open
    if (errorCount > 10) {
      console.log(
        `Circuit breaker OPEN for service ${service} (${errorCount} errors)`
      );
      return false;
    }

    return true;
  }

  /**
   * Record error for circuit breaker
   */
  async recordServiceError(service: string): Promise<void> {
    const errorKey = `errors:${service}`;
    await this.redis.incr(errorKey);
    await this.redis.expire(errorKey, 300); // 5 minutes
  }

  /**
   * Reset circuit breaker
   */
  async resetCircuitBreaker(service: string): Promise<void> {
    await this.redis.del(`errors:${service}`);
    console.log(`Circuit breaker RESET for service ${service}`);
  }

  /**
   * Publish gateway events
   */
  async publishEvent(event: string, data: any): Promise<void> {
    await this.socketAdapter.publish(event, {
      ...data,
      timestamp: Date.now(),
      gateway: "main",
    });
  }

  /**
   * Get current rate limit status for monitoring
   */
  async getRateLimitStatus(): Promise<any> {
    // Get info for different types of rate limits
    const ipLimits = await this.rateLimiter.getInfo(
      "ip:192.168.1.100",
      1000,
      60000
    );
    const userLimits = await this.rateLimiter.getInfo("user:123", 500, 60000);

    return {
      ip: ipLimits,
      user: userLimits,
      timestamp: Date.now(),
    };
  }

  /**
   * Health check - verify Redis connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.set("health:check", Date.now().toString(), 10);
      const result = await this.redis.get("health:check");
      return result !== null;
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }

  // Helper method for waiting on deduplicated requests
  private async waitForRequestResult<T>(requestId: string): Promise<T> {
    const maxWait = 30000; // 30 seconds
    const checkInterval = 100; // 100ms
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const result = await this.cache.get<T>(`result:${requestId}`);
      if (result !== null) {
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    throw new Error(`Timeout waiting for request ${requestId}`);
  }
}

// Example usage
async function gatewayExample() {
  const gateway = new GatewayService();

  console.log("=== Gateway App Redis Usage Example ===\n");

  // 1. Health check
  const healthy = await gateway.healthCheck();
  console.log("Gateway Redis health:", healthy);

  const clientIP = "192.168.1.100";
  const userId = "user-123";
  const endpoint = "/api/users";

  // 2. Check multiple rate limits
  console.log("\n--- Rate Limiting ---");
  const ipAllowed = await gateway.checkIPRateLimit(clientIP);
  const userAllowed = await gateway.checkUserRateLimit(userId);
  const endpointAllowed = await gateway.checkEndpointRateLimit(endpoint);

  console.log("IP rate limit passed:", ipAllowed);
  console.log("User rate limit passed:", userAllowed);
  console.log("Endpoint rate limit passed:", endpointAllowed);

  if (ipAllowed && userAllowed && endpointAllowed) {
    // 3. Check circuit breaker
    const serviceAvailable = await gateway.checkCircuitBreaker("user-service");
    console.log("Service available:", serviceAvailable);

    if (serviceAvailable) {
      // 4. Handle request with deduplication
      console.log("\n--- Request Deduplication ---");
      const requestId = "req-123-expensive-operation";

      // Simulate multiple identical requests
      const promises = Array.from({ length: 3 }, (_, i) =>
        gateway.handleRequestWithDeduplication(requestId, async () => {
          console.log(`Handler ${i + 1} executing...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return `Result from handler ${i + 1}`;
        })
      );

      const results = await Promise.all(promises);
      console.log("Deduplication results:", results);

      // 5. Response caching
      console.log("\n--- Response Caching ---");
      const cacheKey = "api:/users/123/profile";

      // Check cache first
      let cachedResponse = await gateway.getCachedResponse(cacheKey);
      console.log("Cached response:", cachedResponse ? "HIT" : "MISS");

      if (!cachedResponse) {
        // Simulate API response
        const response: CachedResponse = {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: { id: 123, name: "John Doe", email: "john@example.com" },
          cachedAt: Date.now(),
        };

        await gateway.cacheResponse(cacheKey, response, 600); // Cache for 10 minutes
        console.log("Response cached");
      }

      // 6. Publish gateway events
      await gateway.publishEvent("request.completed", {
        requestId,
        endpoint,
        userId,
        duration: 1000,
      });

      // 7. Get rate limit status
      const status = await gateway.getRateLimitStatus();
      console.log("\n--- Rate Limit Status ---");
      console.log("Current limits:", status);
    } else {
      // Service unavailable, record error
      await gateway.recordServiceError("user-service");
    }
  }

  // 8. Cache invalidation
  console.log("\n--- Cache Invalidation ---");
  const invalidated = await gateway.invalidateCachePattern("123");
  console.log("Invalidated cache entries:", invalidated);

  console.log("\n✅ Gateway example completed!");
}

if (import.meta.main) {
  gatewayExample().catch(console.error);
}
