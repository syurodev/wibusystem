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

SessionManager hỗ trợ quản lý session theo cả **User ID** và **Device ID**, cho phép:

- Tạo session với user ID (number) và device ID (string)
- Quản lý sessions theo user hoặc device
- Xóa sessions của user trên device cụ thể hoặc tất cả devices

```typescript
import { SessionManager } from "@repo/redis";

const sessions = new SessionManager(redis);

// Tạo session với userId và deviceId
const sessionId = await sessions.create(
  123, // userId (number)
  "device-mobile-001", // deviceId (string)
  { role: "admin", loginTime: Date.now() } // additional data
);

// Lấy session
const session = await sessions.get(sessionId);

// Update session
await sessions.update(sessionId, { lastActivity: Date.now() });

// Quản lý sessions theo user
const userSessions = await sessions.getUserSessions(123);
await sessions.destroyUserSessions(123); // Xóa tất cả sessions của user

// Quản lý sessions theo device
const deviceSessions = await sessions.getDeviceSessions("device-mobile-001");
await sessions.destroyDeviceSessions("device-mobile-001");

// Quản lý sessions của user trên device cụ thể
const userDeviceSessions = await sessions.getUserDeviceSessions(
  123,
  "device-mobile-001"
);
await sessions.destroyUserDeviceSessions(123, "device-mobile-001");

// Xóa session cụ thể
await sessions.destroy(sessionId);
```

### Rate Limiter

RateLimiter đã được cải tiến với **Lua scripts** để đảm bảo atomic operations và hỗ trợ nhiều algorithms:

#### 🔒 **Atomic Operations (Giải quyết Race Conditions)**

- Sử dụng Lua scripts để thực hiện các operations nguyên tử
- Không còn race conditions giữa INCR và EXPIRE
- Thread-safe cho môi trường concurrent cao

#### 📊 **Fixed Window Algorithm (Default)**

```typescript
import { RateLimiter } from "@repo/redis";

const limiter = new RateLimiter(redis);

// Rate limit per IP (Fixed window)
const result = await limiter.checkLimit("192.168.1.1", 100, 3600000); // 100 requests/hour
if (result.limited) {
  throw new Error("Rate limit exceeded");
}
```

#### 🌊 **Sliding Window Algorithm (More Accurate)**

```typescript
// Sliding window - chống burst traffic hiệu quả hơn
const result = await limiter.checkSlidingWindowLimit("user:123", 10, 60000); // 10 requests/min
if (result.limited) {
  console.log(`Rate limited. Reset at: ${new Date(result.resetTime)}`);
}
```

#### ⚡ **Performance Comparison**

| Algorithm      | Accuracy | Memory Usage | Performance | Use Case                     |
| -------------- | -------- | ------------ | ----------- | ---------------------------- |
| Fixed Window   | Medium   | Low          | High        | General purpose              |
| Sliding Window | High     | Medium       | Medium      | Anti-burst, precise limiting |

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
