import type { RedisClient } from "./redis-client";
import type { CacheOptions, RedisCallback } from "./types";

export class CacheManager {
  private readonly redis: RedisClient;
  private readonly defaultTTL: number;
  private readonly namespace: string;

  constructor(redis: RedisClient, options: CacheOptions = {}) {
    this.redis = redis;
    this.defaultTTL = options.ttl ?? 3600; // 1 hour default
    this.namespace = options.namespace ?? "cache:";
  }

  private getKey(key: string): string {
    return `${this.namespace}${key}`;
  }

  // Set cache với TTL
  async set<T>(key: string, value: T, ttl?: number): Promise<void>;
  async set<T>(
    key: string,
    value: T,
    callback: RedisCallback<void>
  ): Promise<void>;
  async set<T>(
    key: string,
    value: T,
    ttl: number,
    callback: RedisCallback<void>
  ): Promise<void>;
  async set<T>(
    key: string,
    value: T,
    ttlOrCallback?: number | RedisCallback<void>,
    callback?: RedisCallback<void>
  ): Promise<void> {
    const cacheKey = this.getKey(key);
    const serializedValue = JSON.stringify(value);
    const expireTime =
      typeof ttlOrCallback === "number" ? ttlOrCallback : this.defaultTTL;
    const cb = typeof ttlOrCallback === "function" ? ttlOrCallback : callback;

    if (cb) {
      this.redis.set(cacheKey, serializedValue, expireTime, (error, result) => {
        cb(error);
      });
      return;
    }

    await this.redis.set(cacheKey, serializedValue, expireTime);
  }

  // Get cache
  async get<T>(key: string): Promise<T | null>;
  async get<T>(key: string, callback: RedisCallback<T | null>): Promise<void>;
  async get<T>(
    key: string,
    callback?: RedisCallback<T | null>
  ): Promise<T | null | void> {
    const cacheKey = this.getKey(key);

    if (callback) {
      return this.redis.get(cacheKey, (error, result) => {
        if (error) {
          callback(error);
          return;
        }

        if (!result) {
          callback(null, null);
          return;
        }

        try {
          const parsed = JSON.parse(result);
          callback(null, parsed);
        } catch (parseError) {
          callback(parseError as Error);
        }
      });
    }

    const result = await this.redis.get(cacheKey);
    if (!result) return null;

    try {
      return JSON.parse(result);
    } catch (error) {
      throw new Error(`Failed to parse cached value for key ${key}: ${error}`);
    }
  }

  // Delete cache
  async del(key: string): Promise<boolean>;
  async del(key: string, callback: RedisCallback<boolean>): Promise<void>;
  async del(
    key: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const cacheKey = this.getKey(key);

    if (callback) {
      return this.redis.del(cacheKey, (error, result) => {
        if (error) {
          callback(error);
          return;
        }
        callback(null, (result as number) > 0);
      });
    }

    const result = await this.redis.del(cacheKey);
    return result > 0;
  }

  // Check if key exists
  async exists(key: string): Promise<boolean>;
  async exists(key: string, callback: RedisCallback<boolean>): Promise<void>;
  async exists(
    key: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const cacheKey = this.getKey(key);

    if (callback) {
      return this.redis.exists(cacheKey, callback);
    }

    return await this.redis.exists(cacheKey);
  }

  // Get TTL của key
  async ttl(key: string): Promise<number>;
  async ttl(key: string, callback: RedisCallback<number>): Promise<void>;
  async ttl(
    key: string,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    const cacheKey = this.getKey(key);

    if (callback) {
      return this.redis.ttl(cacheKey, callback);
    }

    return await this.redis.ttl(cacheKey);
  }

  // Refresh TTL của key
  async refresh(key: string, ttl?: number): Promise<boolean>;
  async refresh(
    key: string,
    ttl: number,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async refresh(
    key: string,
    ttlOrCallback?: number | RedisCallback<boolean>,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const cacheKey = this.getKey(key);
    const expireTime =
      typeof ttlOrCallback === "number" ? ttlOrCallback : this.defaultTTL;
    const cb = typeof ttlOrCallback === "function" ? ttlOrCallback : callback;

    if (cb) {
      return this.redis.expire(cacheKey, expireTime, cb);
    }

    return await this.redis.expire(cacheKey, expireTime);
  }

  // Get hoặc set nếu không có (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T>;
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    callback: RedisCallback<T>
  ): Promise<void>;
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl: number,
    callback: RedisCallback<T>
  ): Promise<void>;
  async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttlOrCallback?: number | RedisCallback<T>,
    callback?: RedisCallback<T>
  ): Promise<T | void> {
    const expireTime =
      typeof ttlOrCallback === "number" ? ttlOrCallback : this.defaultTTL;
    const cb = typeof ttlOrCallback === "function" ? ttlOrCallback : callback;

    // Async wrapper cho callback mode
    if (cb) {
      try {
        const cached = await this.get<T>(key);
        if (cached !== null) {
          cb(null, cached);
          return;
        }

        const fresh = await fetchFunction();
        await this.set(key, fresh, expireTime);
        cb(null, fresh);
      } catch (error) {
        cb(error as Error);
      }
      return;
    }

    // Promise mode
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetchFunction();
    await this.set(key, fresh, expireTime);
    return fresh;
  }

  // Clear tất cả keys trong namespace
  async clear(): Promise<number>;
  async clear(callback: RedisCallback<number>): Promise<void>;
  async clear(callback?: RedisCallback<number>): Promise<number | void> {
    if (callback) {
      try {
        const keys = await this.redis.send("KEYS", [`${this.namespace}*`]);
        if (!keys || (keys as string[]).length === 0) {
          callback(null, 0);
          return;
        }

        this.redis.del(keys as string[], (error, result) => {
          callback(error, result as number);
        });
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const keys = await this.redis.send("KEYS", [`${this.namespace}*`]);
    if (!keys || (keys as string[]).length === 0) {
      return 0;
    }

    return await this.redis.del(keys as string[]);
  }

  // Multi get - lấy nhiều keys cùng lúc
  async mget<T>(keys: string[]): Promise<(T | null)[]>;
  async mget<T>(
    keys: string[],
    callback: RedisCallback<(T | null)[]>
  ): Promise<void>;
  async mget<T>(
    keys: string[],
    callback?: RedisCallback<(T | null)[]>
  ): Promise<(T | null)[] | void> {
    const cacheKeys = keys.map((key) => this.getKey(key));

    if (callback) {
      try {
        const results = await this.redis.send("MGET", cacheKeys);
        const parsed = (results as (string | null)[]).map((result) => {
          if (!result) return null;
          try {
            return JSON.parse(result);
          } catch {
            return null;
          }
        });
        callback(null, parsed);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const results = await this.redis.send("MGET", cacheKeys);
    return (results as (string | null)[]).map((result) => {
      if (!result) return null;
      try {
        return JSON.parse(result);
      } catch {
        return null;
      }
    });
  }

  // Multi set - set nhiều keys cùng lúc
  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void>;
  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>,
    callback: RedisCallback<void>
  ): Promise<void>;
  async mset<T>(
    entries: Array<{ key: string; value: T; ttl?: number }>,
    callback?: RedisCallback<void>
  ): Promise<void> {
    if (callback) {
      try {
        await Promise.all(
          entries.map((entry) =>
            this.set(entry.key, entry.value, entry.ttl ?? this.defaultTTL)
          )
        );
        callback(null);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    await Promise.all(
      entries.map((entry) =>
        this.set(entry.key, entry.value, entry.ttl ?? this.defaultTTL)
      )
    );
  }
}
