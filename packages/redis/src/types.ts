// Redis Configuration
export interface RedisConfig {
  url?: string;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
  autoReconnect?: boolean;
  maxRetries?: number;
  enableOfflineQueue?: boolean;
  enableAutoPipelining?: boolean;
}

// Connection Pool
export interface ConnectionPool {
  acquire(): Promise<RedisConnection>;
  release(connection: RedisConnection): void;
  destroy(): Promise<void>;
  size: number;
  available: number;
}

// Redis Connection wrapper
export interface RedisConnection {
  id: string;
  client: any; // Bun Redis client
  connected: boolean;
  lastUsed: number;
  connect(): Promise<void>;
  disconnect(): void;
}

// Cache types
export interface CacheEntry<T = any> {
  value: T;
  expiresAt?: number;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string;
}

// Session types
export interface SessionData {
  userId: number;
  deviceId: string;
  data: Record<string, any>;
  createdAt: number;
  expiresAt?: number;
}

export interface SessionOptions {
  ttl?: number; // Default: 24 hours
  prefix?: string; // Default: 'session:'
}

// Rate limiting types
export interface RateLimitResult {
  limited: boolean;
  remaining: number;
  resetTime: number;
  total: number;
}

export interface RateLimitOptions {
  windowMs?: number; // Time window in milliseconds
  prefix?: string; // Default: 'ratelimit:'
}

// Socket adapter types
export interface LockOptions {
  ttl?: number; // Lock TTL in milliseconds
  retryDelay?: number; // Retry delay in milliseconds
  maxRetries?: number; // Max retry attempts
}

export interface LockResult {
  success: boolean;
  lockId?: string;
  expiresAt?: number;
}

// Callback types
export type RedisCallback<T = any> = (error: Error | null, result?: T) => void;

// Event types
export interface RedisEvents {
  connect: () => void;
  disconnect: (error?: Error) => void;
  error: (error: Error) => void;
  reconnect: (attempt: number) => void;
}

// Utility types
export type RedisValue = string | number | Buffer;
export type RedisKey = string;

// Error types
export class RedisError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "RedisError";
  }
}

export class ConnectionError extends RedisError {
  constructor(message: string) {
    super(message, "CONNECTION_ERROR");
    this.name = "ConnectionError";
  }
}

export class RateLimitError extends RedisError {
  constructor(
    message: string,
    public resetTime: number
  ) {
    super(message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
  }
}
