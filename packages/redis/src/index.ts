// Main exports
export { CacheManager } from "./cache-manager";
export { RedisConnectionPool } from "./connection-pool";
export { RateLimiter } from "./rate-limiter";
export { RedisClient } from "./redis-client";
export { SessionManager } from "./session-manager";
export { SocketAdapter } from "./socket-adapter";

// Types exports
export type {
  CacheEntry,
  CacheOptions,
  ConnectionPool,
  LockOptions,
  LockResult,
  RateLimitOptions,
  RateLimitResult,
  RedisCallback,
  RedisConfig,
  RedisConnection,
  RedisEvents,
  RedisKey,
  RedisValue,
  SessionData,
  SessionOptions,
} from "./types";

// Error exports
export { ConnectionError, RateLimitError, RedisError } from "./types";
