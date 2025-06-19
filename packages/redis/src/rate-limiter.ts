import type { RedisClient } from "./redis-client";
import type { RateLimitOptions, RateLimitResult, RedisCallback } from "./types";
import { RateLimitError } from "./types";

export class RateLimiter {
  private redis: RedisClient;
  private defaultWindowMs: number;
  private prefix: string;

  constructor(redis: RedisClient, options: RateLimitOptions = {}) {
    this.redis = redis;
    this.defaultWindowMs = options.windowMs || 3600000; // 1 hour default
    this.prefix = options.prefix || "ratelimit:";
  }

  private getKey(identifier: string, windowStart: number): string {
    return `${this.prefix}${identifier}:${windowStart}`;
  }

  private getCurrentWindow(windowMs: number): number {
    return Math.floor(Date.now() / windowMs) * windowMs;
  }

  // Check rate limit
  async checkLimit(
    identifier: string,
    limit: number,
    windowMs?: number
  ): Promise<RateLimitResult>;
  async checkLimit(
    identifier: string,
    limit: number,
    callback: RedisCallback<RateLimitResult>
  ): Promise<void>;
  async checkLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    callback: RedisCallback<RateLimitResult>
  ): Promise<void>;
  async checkLimit(
    identifier: string,
    limit: number,
    windowMsOrCallback?: number | RedisCallback<RateLimitResult>,
    callback?: RedisCallback<RateLimitResult>
  ): Promise<RateLimitResult | void> {
    const windowMs =
      typeof windowMsOrCallback === "number"
        ? windowMsOrCallback
        : this.defaultWindowMs;
    const cb =
      typeof windowMsOrCallback === "function" ? windowMsOrCallback : callback;

    const windowStart = this.getCurrentWindow(windowMs);
    const key = this.getKey(identifier, windowStart);
    const expireTime = Math.ceil(windowMs / 1000);

    try {
      if (cb) {
        // Callback mode
        const current = await this.redis.incr(key);

        // Set expiration if this is the first request
        if (current === 1) {
          await this.redis.expire(key, expireTime);
        }

        const remaining = Math.max(0, limit - (current as number));
        const resetTime = windowStart + windowMs;

        const result: RateLimitResult = {
          limited: (current as number) > limit,
          remaining,
          resetTime,
          total: limit,
        };

        cb(null, result);
        return;
      }

      // Promise mode
      const current = await this.redis.incr(key);

      // Set expiration if this is the first request
      if (current === 1) {
        await this.redis.expire(key, expireTime);
      }

      const remaining = Math.max(0, limit - (current as number));
      const resetTime = windowStart + windowMs;

      const result: RateLimitResult = {
        limited: (current as number) > limit,
        remaining,
        resetTime,
        total: limit,
      };

      return result;
    } catch (error) {
      if (cb) {
        cb(error as Error);
        return;
      }
      throw error;
    }
  }

  // Check và throw error nếu limit exceeded
  async enforceLimit(
    identifier: string,
    limit: number,
    windowMs?: number,
    errorMessage?: string
  ): Promise<void>;
  async enforceLimit(
    identifier: string,
    limit: number,
    callback: RedisCallback<void>
  ): Promise<void>;
  async enforceLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    callback: RedisCallback<void>
  ): Promise<void>;
  async enforceLimit(
    identifier: string,
    limit: number,
    windowMs: number,
    errorMessage: string,
    callback: RedisCallback<void>
  ): Promise<void>;
  async enforceLimit(
    identifier: string,
    limit: number,
    windowMsOrCallback?: number | RedisCallback<void>,
    errorMessageOrCallback?: string | RedisCallback<void>,
    callback?: RedisCallback<void>
  ): Promise<void> {
    let windowMs = this.defaultWindowMs;
    let errorMessage = "Rate limit exceeded";
    let cb: RedisCallback<void> | undefined;

    // Parse arguments
    if (typeof windowMsOrCallback === "number") {
      windowMs = windowMsOrCallback;
      if (typeof errorMessageOrCallback === "string") {
        errorMessage = errorMessageOrCallback;
        cb = callback;
      } else if (typeof errorMessageOrCallback === "function") {
        cb = errorMessageOrCallback;
      }
    } else if (typeof windowMsOrCallback === "function") {
      cb = windowMsOrCallback;
    }

    try {
      const result = await this.checkLimit(identifier, limit, windowMs);

      if (result && result.limited) {
        const rateLimitError = new (RateLimitError as any)(
          errorMessage,
          result.resetTime
        );

        if (cb) {
          cb(rateLimitError);
          return;
        }

        throw rateLimitError;
      }

      if (cb) {
        cb(null);
      }
    } catch (error) {
      if (cb) {
        cb(error as Error);
        return;
      }
      throw error;
    }
  }

  // Get current count
  async getCurrentCount(identifier: string, windowMs?: number): Promise<number>;
  async getCurrentCount(
    identifier: string,
    callback: RedisCallback<number>
  ): Promise<void>;
  async getCurrentCount(
    identifier: string,
    windowMs: number,
    callback: RedisCallback<number>
  ): Promise<void>;
  async getCurrentCount(
    identifier: string,
    windowMsOrCallback?: number | RedisCallback<number>,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    const windowMs =
      typeof windowMsOrCallback === "number"
        ? windowMsOrCallback
        : this.defaultWindowMs;
    const cb =
      typeof windowMsOrCallback === "function" ? windowMsOrCallback : callback;

    const windowStart = this.getCurrentWindow(windowMs);
    const key = this.getKey(identifier, windowStart);

    if (cb) {
      try {
        const result = await this.redis.get(key);
        const count = result ? parseInt(result, 10) : 0;
        cb(null, count);
      } catch (error) {
        cb(error as Error);
      }
      return;
    }

    const result = await this.redis.get(key);
    return result ? parseInt(result, 10) : 0;
  }

  // Reset count for identifier
  async reset(identifier: string, windowMs?: number): Promise<boolean>;
  async reset(
    identifier: string,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async reset(
    identifier: string,
    windowMs: number,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async reset(
    identifier: string,
    windowMsOrCallback?: number | RedisCallback<boolean>,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const windowMs =
      typeof windowMsOrCallback === "number"
        ? windowMsOrCallback
        : this.defaultWindowMs;
    const cb =
      typeof windowMsOrCallback === "function" ? windowMsOrCallback : callback;

    const windowStart = this.getCurrentWindow(windowMs);
    const key = this.getKey(identifier, windowStart);

    if (cb) {
      try {
        const result = await this.redis.del(key);
        cb(null, (result as number) > 0);
      } catch (error) {
        cb(error as Error);
      }
      return;
    }

    const result = await this.redis.del(key);
    return (result as number) > 0;
  }

  // Get multiple limits at once
  async checkMultipleLimit(
    identifiers: string[],
    limit: number,
    windowMs?: number
  ): Promise<Record<string, RateLimitResult>>;
  async checkMultipleLimit(
    identifiers: string[],
    limit: number,
    callback: RedisCallback<Record<string, RateLimitResult>>
  ): Promise<void>;
  async checkMultipleLimit(
    identifiers: string[],
    limit: number,
    windowMs: number,
    callback: RedisCallback<Record<string, RateLimitResult>>
  ): Promise<void>;
  async checkMultipleLimit(
    identifiers: string[],
    limit: number,
    windowMsOrCallback?:
      | number
      | RedisCallback<Record<string, RateLimitResult>>,
    callback?: RedisCallback<Record<string, RateLimitResult>>
  ): Promise<Record<string, RateLimitResult> | void> {
    const windowMs =
      typeof windowMsOrCallback === "number"
        ? windowMsOrCallback
        : this.defaultWindowMs;
    const cb =
      typeof windowMsOrCallback === "function" ? windowMsOrCallback : callback;

    try {
      const results: Record<string, RateLimitResult> = {};

      // Check all identifiers in parallel
      const promises = identifiers.map(async (identifier) => {
        const result = await this.checkLimit(identifier, limit, windowMs);
        return { identifier, result };
      });

      const resolvedResults = await Promise.all(promises);

      for (const { identifier, result } of resolvedResults) {
        results[identifier] = result as RateLimitResult;
      }

      if (cb) {
        cb(null, results);
        return;
      }

      return results;
    } catch (error) {
      if (cb) {
        cb(error as Error);
        return;
      }
      throw error;
    }
  }

  // Clean up expired keys (for maintenance)
  async cleanup(): Promise<number>;
  async cleanup(callback: RedisCallback<number>): Promise<void>;
  async cleanup(callback?: RedisCallback<number>): Promise<number | void> {
    if (callback) {
      try {
        const pattern = `${this.prefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];
        let cleanedCount = 0;

        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl === -1) {
            // No expiration set
            await this.redis.del(key);
            cleanedCount++;
          }
        }

        callback(null, cleanedCount);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const pattern = `${this.prefix}*`;
    const keys = (await this.redis.send("KEYS", [pattern])) as string[];
    let cleanedCount = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) {
        // No expiration set
        await this.redis.del(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  // Get rate limit info without incrementing
  async getInfo(
    identifier: string,
    limit: number,
    windowMs?: number
  ): Promise<RateLimitResult>;
  async getInfo(
    identifier: string,
    limit: number,
    callback: RedisCallback<RateLimitResult>
  ): Promise<void>;
  async getInfo(
    identifier: string,
    limit: number,
    windowMs: number,
    callback: RedisCallback<RateLimitResult>
  ): Promise<void>;
  async getInfo(
    identifier: string,
    limit: number,
    windowMsOrCallback?: number | RedisCallback<RateLimitResult>,
    callback?: RedisCallback<RateLimitResult>
  ): Promise<RateLimitResult | void> {
    const windowMs =
      typeof windowMsOrCallback === "number"
        ? windowMsOrCallback
        : this.defaultWindowMs;
    const cb =
      typeof windowMsOrCallback === "function" ? windowMsOrCallback : callback;

    const windowStart = this.getCurrentWindow(windowMs);
    const key = this.getKey(identifier, windowStart);

    try {
      const current = await this.getCurrentCount(identifier, windowMs);
      const remaining = Math.max(0, limit - current);
      const resetTime = windowStart + windowMs;

      const result: RateLimitResult = {
        limited: current > limit,
        remaining,
        resetTime,
        total: limit,
      };

      if (cb) {
        cb(null, result);
        return;
      }

      return result;
    } catch (error) {
      if (cb) {
        cb(error as Error);
        return;
      }
      throw error;
    }
  }
}
