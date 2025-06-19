/**
 * Demo Race Condition: Tại sao phải dùng Lua scripts
 */

import { RedisClient } from "@repo/redis";

class RaceConditionDemo {
  private redis: RedisClient;

  constructor() {
    this.redis = new RedisClient({
      url: "redis://localhost:6379",
      maxConnections: 20,
    });
  }

  /**
   * ❌ BAD: Rate limiter KHÔNG dùng Lua (có race condition)
   */
  async badRateLimit(
    key: string,
    limit: number,
    ttlSeconds: number
  ): Promise<{ allowed: boolean; count: number }> {
    // 🚨 RACE CONDITION HERE!
    const current = await this.redis.incr(key);

    // Nếu đây là request đầu tiên, set expire
    if (current === 1) {
      await this.redis.expire(key, ttlSeconds);
    }

    return {
      allowed: (current as number) <= limit,
      count: current as number,
    };
  }

  /**
   * ✅ GOOD: Rate limiter dùng Lua (atomic)
   */
  private readonly luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local ttl = tonumber(ARGV[2])
    
    local current = redis.call('GET', key)
    if current == false then
      current = 0
    else
      current = tonumber(current)
    end
    
    if current >= limit then
      return {current, 0} -- {count, allowed}
    end
    
    local newCount = redis.call('INCR', key)
    if newCount == 1 then
      redis.call('EXPIRE', key, ttl)
    end
    
    return {newCount, 1} -- {count, allowed}
  `;

  async goodRateLimit(
    key: string,
    limit: number,
    ttlSeconds: number
  ): Promise<{ allowed: boolean; count: number }> {
    const result = (await this.redis.send("EVAL", [
      this.luaScript,
      "1",
      key,
      limit.toString(),
      ttlSeconds.toString(),
    ])) as number[];

    const [count, allowed] = result;
    return {
      allowed: allowed === 1,
      count,
    };
  }

  /**
   * Test race condition với concurrent requests
   */
  async testRaceCondition(): Promise<void> {
    console.log("🧪 Testing Race Conditions...\n");

    const testCases = [
      { method: "❌ WITHOUT Lua", fn: this.badRateLimit.bind(this) },
      { method: "✅ WITH Lua", fn: this.goodRateLimit.bind(this) },
    ];

    for (const testCase of testCases) {
      console.log(`--- ${testCase.method} ---`);

      const key = `test:${Math.random()}`;
      const limit = 5;
      const ttl = 10;

      // Tạo 10 concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        testCase.fn(key, limit, ttl).then((result) => ({
          requestId: i + 1,
          ...result,
        }))
      );

      const results = await Promise.all(promises);

      // Phân tích kết quả
      const allowed = results.filter((r) => r.allowed);
      const blocked = results.filter((r) => !r.allowed);

      console.log(`🎯 Expected: ${limit} allowed, ${10 - limit} blocked`);
      console.log(
        `📊 Actual: ${allowed.length} allowed, ${blocked.length} blocked`
      );

      // Kiểm tra TTL
      const ttlRemaining = await this.redis.ttl(key);
      console.log(`⏰ TTL remaining: ${ttlRemaining} seconds`);

      if (ttlRemaining === -1) {
        console.log("🚨 WARNING: Key has no expiration! MEMORY LEAK!");
      }

      // Log chi tiết
      console.log(
        "Results:",
        results
          .map((r) => `${r.requestId}:${r.allowed ? "✅" : "❌"}(${r.count})`)
          .join(" ")
      );

      console.log("");

      // Cleanup
      await this.redis.del(key);
    }
  }

  /**
   * Demo performance comparison
   */
  async performanceComparison(): Promise<void> {
    console.log("⚡ Performance Comparison...\n");

    const iterations = 1000;
    const key = "perf-test";
    const limit = 100;
    const ttl = 60;

    // Test without Lua
    await this.redis.del(key);
    const start1 = Date.now();

    for (let i = 0; i < iterations; i++) {
      await this.badRateLimit(key, limit, ttl);
    }

    const time1 = Date.now() - start1;
    await this.redis.del(key);

    // Test with Lua
    const start2 = Date.now();

    for (let i = 0; i < iterations; i++) {
      await this.goodRateLimit(key, limit, ttl);
    }

    const time2 = Date.now() - start2;
    await this.redis.del(key);

    console.log(
      `❌ Without Lua: ${time1}ms (${((iterations / time1) * 1000).toFixed(0)} ops/sec)`
    );
    console.log(
      `✅ With Lua: ${time2}ms (${((iterations / time2) * 1000).toFixed(0)} ops/sec)`
    );
    console.log(
      `📈 Performance difference: ${(((time1 - time2) / time1) * 100).toFixed(1)}%`
    );
    console.log("");
  }

  /**
   * Demo memory leaks từ race conditions
   */
  async memoryLeakDemo(): Promise<void> {
    console.log("💾 Memory Leak Demo...\n");

    const keyPrefix = "leak-test";

    console.log("Creating 50 keys with race conditions...");

    // Tạo nhiều keys với race condition
    const promises = Array.from({ length: 50 }, async (_, i) => {
      const key = `${keyPrefix}:${i}`;

      // Simulate race condition - multiple requests hit at same time
      const concurrentPromises = Array.from({ length: 5 }, () =>
        this.badRateLimit(key, 1, 5)
      );

      await Promise.all(concurrentPromises);
      return key;
    });

    const keys = await Promise.all(promises);

    // Kiểm tra TTL của các keys
    let leakedKeys = 0;
    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        leakedKeys++;
      }
    }

    console.log(
      `🚨 Keys without expiration (memory leaks): ${leakedKeys}/${keys.length}`
    );
    console.log(`💡 This is why we need atomic operations!\n`);

    // Cleanup
    for (const key of keys) {
      await this.redis.del(key);
    }
  }

  /**
   * Tại sao Redis commands không atomic?
   */
  explainWhyRedisNeedsLua(): void {
    console.log("📚 Why Redis Commands Are Not Atomic?\n");

    console.log("🔹 Redis commands are atomic individually:");
    console.log("   ✅ INCR key  (atomic)");
    console.log("   ✅ EXPIRE key 3600  (atomic)");
    console.log("");

    console.log("🔸 BUT multiple commands are NOT atomic:");
    console.log("   ❌ INCR + EXPIRE  (2 separate network calls)");
    console.log("");

    console.log("🔹 Network delays between commands:");
    console.log("   Client A: INCR key → 1");
    console.log("   Client B: INCR key → 2  (before A sets expire!)");
    console.log("   Client A: EXPIRE key 3600");
    console.log("   Client B: (skips expire because count != 1)");
    console.log("");

    console.log("✅ Lua script solution:");
    console.log("   🚀 Single network call");
    console.log("   ⚡ Executes atomically on Redis server");
    console.log("   🔒 No other commands can interfere");
    console.log("");
  }

  async cleanup(): Promise<void> {
    await this.redis.send("FLUSHDB", []);
    await this.redis.disconnect();
  }
}

// Run demo
async function runDemo() {
  const demo = new RaceConditionDemo();

  try {
    demo.explainWhyRedisNeedsLua();
    console.log("=".repeat(60) + "\n");

    await demo.testRaceCondition();
    console.log("=".repeat(60) + "\n");

    await demo.memoryLeakDemo();
    console.log("=".repeat(60) + "\n");

    await demo.performanceComparison();
  } catch (error) {
    console.error("Demo failed:", error);
  } finally {
    await demo.cleanup();
  }
}

if (require.main === module) {
  runDemo().catch(console.error);
}

export { RaceConditionDemo };
