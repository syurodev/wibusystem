# @repo/redis

Redis client package cho wibusystem monorepo. Sử dụng Bun native Redis client với các tính năng:

- Basic operations (get/set/delete)
- Cache với TTL
- Session management
- Rate limiting
- Socket adapter
- Connection pooling

## Cài đặt

Package này sử dụng Bun native Redis client (v1.2.9+), không cần cài thêm dependencies.

## Sử dụng

### Basic Usage

```typescript
import { RedisClient } from "@repo/redis";

const redis = new RedisClient({
  url: "redis://localhost:6379",
  maxConnections: 10,
});

// Basic operations
await redis.set("key", "value");
const value = await redis.get("key");
await redis.del("key");
```

### Cache Manager

```typescript
import { CacheManager } from "@repo/redis";

const cache = new CacheManager(redis);

// Cache với TTL
await cache.set("user:123", userData, 3600); // expire sau 1 giờ
const user = await cache.get("user:123");
```

### Session Manager

```typescript
import { SessionManager } from "@repo/redis";

const sessions = new SessionManager(redis);

// Tạo session
const sessionId = await sessions.create("user123", { role: "admin" });

// Lấy session
const session = await sessions.get(sessionId);

// Xóa session
await sessions.destroy(sessionId);
```

### Rate Limiter

```typescript
import { RateLimiter } from "@repo/redis";

const limiter = new RateLimiter(redis);

// Rate limit per IP
const result = await limiter.checkLimit("192.168.1.1", 100, 3600); // 100 requests per hour
if (result.limited) {
  throw new Error("Rate limit exceeded");
}
```

### Socket Adapter

```typescript
import { SocketAdapter } from "@repo/redis";

const adapter = new SocketAdapter(redis);

// Lock mechanism
const lockId = await adapter.acquireLock("resource:123", 30000); // lock 30s
if (lockId) {
  // Do work
  await adapter.releaseLock("resource:123", lockId);
}
```

## Configuration

```typescript
interface RedisConfig {
  url?: string; // Default: redis://localhost:6379
  maxConnections?: number; // Default: 10
  connectionTimeout?: number; // Default: 10000ms
  idleTimeout?: number; // Default: 30000ms
  autoReconnect?: boolean; // Default: true
  maxRetries?: number; // Default: 10
  enableOfflineQueue?: boolean; // Default: true
  enableAutoPipelining?: boolean; // Default: true
}
```

## License

MIT
