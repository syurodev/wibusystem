import {
  CacheManager,
  RateLimiter,
  RedisClient,
  SessionManager,
  SocketAdapter,
} from "@repo/redis";

async function basicUsageExample() {
  // Tạo Redis client
  const redis = new RedisClient({
    url: "redis://localhost:6379",
    maxConnections: 10,
  });

  // Basic operations
  console.log("=== Basic Redis Operations ===");
  await redis.set("greeting", "Hello from Redis!");
  const greeting = await redis.get("greeting");
  console.log("Greeting:", greeting);

  // Set với TTL (expire sau 10 giây)
  await redis.set("temp", "This will expire", 10);
  console.log("TTL for temp key:", await redis.ttl("temp"));

  // Hash operations
  await redis.hset("user:1", "name", "Alice");
  await redis.hset("user:1", "email", "alice@example.com");
  const userName = await redis.hget("user:1", "name");
  console.log("User name:", userName);

  // Set operations
  await redis.sadd("tags", "javascript");
  await redis.sadd("tags", "typescript");
  const isMember = await redis.sismember("tags", "javascript");
  console.log("Is javascript a tag?", isMember);
}

async function cacheExample() {
  const redis = new RedisClient();
  const cache = new CacheManager(redis, {
    namespace: "app:cache:",
    ttl: 3600, // 1 hour default
  });

  console.log("\n=== Cache Manager Example ===");

  // Cache user data
  const userData = { id: 1, name: "John Doe", email: "john@example.com" };
  await cache.set("user:1", userData, 1800); // Cache for 30 minutes

  // Get cached data
  const cachedUser = await cache.get<typeof userData>("user:1");
  console.log("Cached user:", cachedUser);

  // Cache-aside pattern
  const expensiveData = await cache.getOrSet(
    "expensive:computation",
    async () => {
      console.log("Computing expensive operation...");
      // Simulate expensive operation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { result: "Computed result", timestamp: Date.now() };
    },
    600
  ); // Cache for 10 minutes

  console.log("Expensive data:", expensiveData);
}

async function sessionExample() {
  const redis = new RedisClient();
  const sessions = new SessionManager(redis, {
    prefix: "sess:",
    ttl: 86400, // 24 hours
  });

  console.log("\n=== Session Manager Example ===");

  // Create session
  const sessionId = await sessions.create("user123", {
    role: "admin",
    permissions: ["read", "write"],
    loginTime: Date.now(),
  });

  console.log("Created session:", sessionId);

  // Get session
  const session = await sessions.get(sessionId);
  console.log("Session data:", session);

  // Update session
  await sessions.update(sessionId, {
    lastActivity: Date.now(),
    pageViews: 5,
  });

  // Refresh session TTL
  await sessions.refresh(sessionId, 7200); // Extend to 2 hours

  console.log("Session updated and refreshed");
}

async function rateLimitExample() {
  const redis = new RedisClient();
  const limiter = new RateLimiter(redis, {
    prefix: "limit:",
    windowMs: 60000, // 1 minute window
  });

  console.log("\n=== Rate Limiter Example ===");

  const clientIP = "192.168.1.100";

  // Check rate limit (100 requests per minute)
  for (let i = 0; i < 5; i++) {
    const result = await limiter.checkLimit(clientIP, 100, 60000);
    console.log(`Request ${i + 1}:`, {
      limited: result.limited,
      remaining: result.remaining,
      resetTime: new Date(result.resetTime).toISOString(),
    });
  }

  // Check multiple IPs at once
  const multipleResults = await limiter.checkMultipleLimit(
    ["192.168.1.100", "192.168.1.101", "192.168.1.102"],
    100,
    60000
  );
  console.log("Multiple limit check:", multipleResults);
}

async function socketAdapterExample() {
  const redis = new RedisClient();
  const adapter = new SocketAdapter(redis, {
    lockPrefix: "lock:",
    channelPrefix: "channel:",
  });

  console.log("\n=== Socket Adapter Example ===");

  const resource = "user:123:profile";

  // Acquire lock
  const lockId = await adapter.acquireLock(resource, 30000); // 30 seconds

  if (lockId) {
    console.log("Lock acquired:", lockId);

    // Do some work with the locked resource
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Work completed");

    // Release lock
    const released = await adapter.releaseLock(resource, lockId);
    console.log("Lock released:", released);
  } else {
    console.log("Failed to acquire lock");
  }

  // Use withLock for automatic lock management
  const result = await adapter.withLock(
    resource,
    async () => {
      console.log("Executing critical section...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      return "Operation completed successfully";
    },
    10000
  ); // 10 second timeout

  console.log("WithLock result:", result);

  // Publish message
  const subscribers = await adapter.publish("notifications", {
    type: "user_update",
    userId: 123,
    timestamp: Date.now(),
  });
  console.log("Message published to", subscribers, "subscribers");
}

async function main() {
  try {
    await basicUsageExample();
    await cacheExample();
    await sessionExample();
    await rateLimitExample();
    await socketAdapterExample();

    console.log("\n✅ All examples completed successfully!");
  } catch (error) {
    console.error("❌ Error running examples:", error);
  } finally {
    process.exit(0);
  }
}

// Run examples
if (import.meta.main) {
  main();
}
