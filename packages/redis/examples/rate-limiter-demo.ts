/**
 * Demo các thuật toán rate limiting và atomic operations
 */

import { RateLimiter, RedisClient } from "@repo/redis";

class RateLimiterDemo {
  private redis: RedisClient;
  private limiter: RateLimiter;

  constructor() {
    this.redis = new RedisClient({
      url: "redis://localhost:6379",
      maxConnections: 20,
    });

    this.limiter = new RateLimiter(this.redis);
  }

  /**
   * Demo Fixed Window vs Sliding Window
   */
  async demoAlgorithmComparison(): Promise<void> {
    console.log("=== Fixed Window vs Sliding Window Demo ===\n");

    const identifier = "demo-user";
    const limit = 5; // 5 requests
    const windowMs = 10000; // 10 seconds

    console.log(`Limit: ${limit} requests per ${windowMs / 1000} seconds\n`);

    // Reset counters
    await this.limiter.reset(identifier, windowMs);
    await this.redis.del("ratelimit:sliding:demo-user");

    console.log("🔄 Sending 7 requests quickly (burst scenario)...\n");

    for (let i = 1; i <= 7; i++) {
      const [fixedResult, slidingResult] = await Promise.all([
        this.limiter.checkLimit(identifier, limit, windowMs),
        this.limiter.checkSlidingWindowLimit(identifier, limit, windowMs),
      ]);

      console.log(`Request ${i}:`);
      console.log(
        `  Fixed Window   - Limited: ${fixedResult.limited}, Remaining: ${fixedResult.remaining}`
      );
      console.log(
        `  Sliding Window - Limited: ${slidingResult.limited}, Remaining: ${slidingResult.remaining}`
      );
      console.log("");

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Demo atomic operations - no race conditions
   */
  async demoAtomicOperations(): Promise<void> {
    console.log("=== Atomic Operations Demo ===\n");

    const identifier = "concurrent-test";
    const limit = 10;
    const windowMs = 5000; // 5 seconds

    // Reset counter
    await this.limiter.reset(identifier, windowMs);

    console.log("🚀 Simulating 20 concurrent requests...\n");

    // Tạo 20 concurrent requests
    const promises = Array.from({ length: 20 }, (_, i) =>
      this.makeRequest(identifier, limit, windowMs, i + 1)
    );

    const results = await Promise.all(promises);

    // Phân tích kết quả
    const allowed = results.filter((r) => !r.limited).length;
    const blocked = results.filter((r) => r.limited).length;

    console.log(`✅ Allowed requests: ${allowed}`);
    console.log(`❌ Blocked requests: ${blocked}`);
    console.log(`🎯 Expected allowed: ${limit} (should match!)\n`);

    if (allowed === limit) {
      console.log("✅ Perfect! No race conditions detected.");
    } else {
      console.log("❌ Race condition detected - atomic operations failed!");
    }
  }

  private async makeRequest(
    identifier: string,
    limit: number,
    windowMs: number,
    requestId: number
  ): Promise<{ requestId: number; limited: boolean; count: number }> {
    try {
      const result = await this.limiter.checkLimit(identifier, limit, windowMs);
      return {
        requestId,
        limited: result.limited,
        count: limit - result.remaining,
      };
    } catch (error) {
      console.error(`Request ${requestId} failed:`, error);
      return { requestId, limited: true, count: 0 };
    }
  }

  /**
   * Demo rate limit enforcement với custom error messages
   */
  async demoEnforcement(): Promise<void> {
    console.log("=== Rate Limit Enforcement Demo ===\n");

    const identifier = "api-user";
    const limit = 3;
    const windowMs = 5000;

    // Reset
    await this.limiter.reset(identifier, windowMs);

    console.log(`Testing enforcement with ${limit} requests limit...\n`);

    for (let i = 1; i <= 5; i++) {
      try {
        await this.limiter.enforceLimit(
          identifier,
          limit,
          windowMs,
          `API rate limit exceeded. Try again later.`
        );
        console.log(`✅ Request ${i}: Allowed`);
      } catch (error: any) {
        console.log(`❌ Request ${i}: ${error.message}`);
        if (error.resetTime) {
          const resetIn = Math.ceil((error.resetTime - Date.now()) / 1000);
          console.log(`   Reset in ${resetIn} seconds`);
        }
      }
    }
  }

  /**
   * Demo multi-identifier rate limiting
   */
  async demoMultipleIdentifiers(): Promise<void> {
    console.log("\n=== Multiple Identifiers Demo ===\n");

    const identifiers = ["user1", "user2", "user3"];
    const limit = 2;
    const windowMs = 3000;

    // Reset all
    for (const id of identifiers) {
      await this.limiter.reset(id, windowMs);
    }

    console.log("Testing multiple users simultaneously...\n");

    // Each user makes 3 requests
    const allPromises = identifiers.flatMap((userId) =>
      Array.from({ length: 3 }, async (_, i) => {
        const result = await this.limiter.checkLimit(userId, limit, windowMs);
        return { userId, requestNum: i + 1, ...result };
      })
    );

    const results = await Promise.all(allPromises);

    // Group by user
    const grouped = results.reduce(
      (acc, result) => {
        if (!acc[result.userId]) acc[result.userId] = [];
        acc[result.userId].push(result);
        return acc;
      },
      {} as Record<string, typeof results>
    );

    for (const [userId, userResults] of Object.entries(grouped)) {
      console.log(`${userId}:`);
      userResults.forEach((r) => {
        const status = r.limited ? "❌ BLOCKED" : "✅ ALLOWED";
        console.log(
          `  Request ${r.requestNum}: ${status} (${r.remaining} remaining)`
        );
      });
      console.log();
    }
  }

  /**
   * Performance test
   */
  async performanceTest(): Promise<void> {
    console.log("=== Performance Test ===\n");

    const iterations = 1000;
    const identifier = "perf-test";
    const limit = 100;
    const windowMs = 60000;

    // Reset
    await this.limiter.reset(identifier, windowMs);

    // Test Fixed Window
    console.log(`Testing Fixed Window: ${iterations} requests...`);
    const fixedStart = Date.now();

    for (let i = 0; i < iterations; i++) {
      await this.limiter.checkLimit(identifier, limit, windowMs);
    }

    const fixedTime = Date.now() - fixedStart;
    console.log(
      `Fixed Window: ${fixedTime}ms (${((iterations / fixedTime) * 1000).toFixed(0)} ops/sec)\n`
    );

    // Reset
    await this.redis.del("ratelimit:sliding:perf-test");

    // Test Sliding Window
    console.log(`Testing Sliding Window: ${iterations} requests...`);
    const slidingStart = Date.now();

    for (let i = 0; i < iterations; i++) {
      await this.limiter.checkSlidingWindowLimit(identifier, limit, windowMs);
    }

    const slidingTime = Date.now() - slidingStart;
    console.log(
      `Sliding Window: ${slidingTime}ms (${((iterations / slidingTime) * 1000).toFixed(0)} ops/sec)\n`
    );

    console.log(
      `Performance difference: ${(((slidingTime - fixedTime) / fixedTime) * 100).toFixed(1)}%`
    );
  }

  async cleanup(): Promise<void> {
    await this.redis.send("FLUSHDB", []);
    await this.redis.disconnect();
  }
}

// Run demo
async function runDemo() {
  const demo = new RateLimiterDemo();

  try {
    await demo.demoAtomicOperations();
    console.log("\n" + "=".repeat(50) + "\n");

    await demo.demoAlgorithmComparison();
    console.log("\n" + "=".repeat(50) + "\n");

    await demo.demoEnforcement();
    console.log("\n" + "=".repeat(50) + "\n");

    await demo.demoMultipleIdentifiers();
    console.log("=".repeat(50) + "\n");

    await demo.performanceTest();
  } catch (error) {
    console.error("Demo failed:", error);
  } finally {
    await demo.cleanup();
  }
}

if (require.main === module) {
  runDemo().catch(console.error);
}

export { RateLimiterDemo };
