import type { RedisClient } from "./redis-client";
import type { LockOptions, RedisCallback } from "./types";

export class SocketAdapter {
  private readonly redis: RedisClient;
  private readonly lockPrefix: string;
  private readonly channelPrefix: string;

  constructor(
    redis: RedisClient,
    options: { lockPrefix?: string; channelPrefix?: string } = {}
  ) {
    this.redis = redis;
    this.lockPrefix = options.lockPrefix ?? "lock:";
    this.channelPrefix = options.channelPrefix ?? "channel:";
  }

  private generateLockId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  private getLockKey(resource: string): string {
    return `${this.lockPrefix}${resource}`;
  }

  // Acquire lock
  async acquireLock(
    resource: string,
    ttl?: number,
    options?: LockOptions
  ): Promise<string | null>;
  async acquireLock(
    resource: string,
    callback: RedisCallback<string | null>
  ): Promise<void>;
  async acquireLock(
    resource: string,
    ttl: number,
    callback: RedisCallback<string | null>
  ): Promise<void>;
  async acquireLock(
    resource: string,
    ttl: number,
    options: LockOptions,
    callback: RedisCallback<string | null>
  ): Promise<void>;
  async acquireLock(
    resource: string,
    ttlOrCallback?: number | RedisCallback<string | null>,
    optionsOrCallback?: LockOptions | RedisCallback<string | null>,
    callback?: RedisCallback<string | null>
  ): Promise<string | null | void> {
    let ttl = 30000; // 30 seconds default
    let options: LockOptions = {};
    let cb: RedisCallback<string | null> | undefined;

    // Parse arguments
    if (typeof ttlOrCallback === "number") {
      ttl = ttlOrCallback;
      if (
        typeof optionsOrCallback === "object" &&
        optionsOrCallback !== null &&
        !("length" in optionsOrCallback)
      ) {
        options = optionsOrCallback;
        cb = callback;
      } else if (typeof optionsOrCallback === "function") {
        cb = optionsOrCallback;
      }
    } else if (typeof ttlOrCallback === "function") {
      cb = ttlOrCallback;
    }

    const lockId = this.generateLockId();
    const lockKey = this.getLockKey(resource);
    const expireTimeMs = ttl;
    const expireTimeSec = Math.ceil(expireTimeMs / 1000);

    const maxRetries = options.maxRetries ?? 3;
    const retryDelay = options.retryDelay ?? 100;

    const tryAcquire = async (attempt: number = 0): Promise<string | null> => {
      try {
        // Try to set the lock với NX (only if not exists) và EX (expiration)
        const result = await this.redis.send("SET", [
          lockKey,
          lockId,
          "NX",
          "EX",
          expireTimeSec.toString(),
        ]);

        if (result === "OK") {
          return lockId;
        }

        // Lock already exists, check if we should retry
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
          return tryAcquire(attempt + 1);
        }

        return null;
      } catch (error) {
        if (cb) {
          cb(error as Error);
          return null;
        }
        throw error;
      }
    };

    if (cb) {
      try {
        const result = await tryAcquire();
        cb(null, result);
      } catch (error) {
        cb(error as Error);
      }
      return;
    }

    return await tryAcquire();
  }

  // Release lock
  async releaseLock(resource: string, lockId: string): Promise<boolean>;
  async releaseLock(
    resource: string,
    lockId: string,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async releaseLock(
    resource: string,
    lockId: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const lockKey = this.getLockKey(resource);

    // Lua script để đảm bảo chỉ xóa lock nếu lockId match
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    if (callback) {
      try {
        const result = await this.redis.send("EVAL", [
          luaScript,
          "1",
          lockKey,
          lockId,
        ]);
        callback(null, (result as number) === 1);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const result = await this.redis.send("EVAL", [
      luaScript,
      "1",
      lockKey,
      lockId,
    ]);
    return (result as number) === 1;
  }

  // Check if lock exists
  async isLocked(resource: string): Promise<boolean>;
  async isLocked(
    resource: string,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async isLocked(
    resource: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const lockKey = this.getLockKey(resource);

    if (callback) {
      try {
        const result = await this.redis.exists(lockKey);
        callback(null, result);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    return await this.redis.exists(lockKey);
  }

  // Get lock info
  async getLockInfo(
    resource: string
  ): Promise<{ lockId: string | null; ttl: number }>;
  async getLockInfo(
    resource: string,
    callback: RedisCallback<{ lockId: string | null; ttl: number }>
  ): Promise<void>;
  async getLockInfo(
    resource: string,
    callback?: RedisCallback<{ lockId: string | null; ttl: number }>
  ): Promise<{ lockId: string | null; ttl: number } | void> {
    const lockKey = this.getLockKey(resource);

    if (callback) {
      try {
        const [lockId, ttl] = await Promise.all([
          this.redis.get(lockKey),
          this.redis.ttl(lockKey),
        ]);

        callback(null, {
          lockId: lockId,
          ttl: ttl,
        });
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const [lockId, ttl] = await Promise.all([
      this.redis.get(lockKey),
      this.redis.ttl(lockKey),
    ]);

    return {
      lockId: lockId,
      ttl: ttl,
    };
  }

  // Extend lock TTL
  async extendLock(
    resource: string,
    lockId: string,
    ttl: number
  ): Promise<boolean>;
  async extendLock(
    resource: string,
    lockId: string,
    ttl: number,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async extendLock(
    resource: string,
    lockId: string,
    ttl: number,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const lockKey = this.getLockKey(resource);
    const expireTimeSec = Math.ceil(ttl / 1000);

    // Lua script để extend lock chỉ khi lockId match
    const luaScript = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("EXPIRE", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    if (callback) {
      try {
        const result = await this.redis.send("EVAL", [
          luaScript,
          "1",
          lockKey,
          lockId,
          expireTimeSec.toString(),
        ]);
        callback(null, (result as number) === 1);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const result = await this.redis.send("EVAL", [
      luaScript,
      "1",
      lockKey,
      lockId,
      expireTimeSec.toString(),
    ]);
    return (result as number) === 1;
  }

  // Force release lock (admin function)
  async forceReleaseLock(resource: string): Promise<boolean>;
  async forceReleaseLock(
    resource: string,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async forceReleaseLock(
    resource: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const lockKey = this.getLockKey(resource);

    if (callback) {
      try {
        const result = await this.redis.del(lockKey);
        callback(null, result > 0);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const result = await this.redis.del(lockKey);
    return result > 0;
  }

  // Execute with lock (automatically acquire and release)
  async withLock<T>(
    resource: string,
    task: () => Promise<T>,
    ttl?: number,
    options?: LockOptions
  ): Promise<T>;
  async withLock<T>(
    resource: string,
    task: () => Promise<T>,
    callback: RedisCallback<T>
  ): Promise<void>;
  async withLock<T>(
    resource: string,
    task: () => Promise<T>,
    ttl: number,
    callback: RedisCallback<T>
  ): Promise<void>;
  async withLock<T>(
    resource: string,
    task: () => Promise<T>,
    ttl: number,
    options: LockOptions,
    callback: RedisCallback<T>
  ): Promise<void>;
  async withLock<T>(
    resource: string,
    task: () => Promise<T>,
    ttlOrCallback?: number | RedisCallback<T>,
    optionsOrCallback?: LockOptions | RedisCallback<T>,
    callback?: RedisCallback<T>
  ): Promise<T | void> {
    let ttl = 30000;
    let options: LockOptions = {};
    let cb: RedisCallback<T> | undefined;

    // Parse arguments
    if (typeof ttlOrCallback === "number") {
      ttl = ttlOrCallback;
      if (
        typeof optionsOrCallback === "object" &&
        optionsOrCallback !== null &&
        !("length" in optionsOrCallback)
      ) {
        options = optionsOrCallback;
        cb = callback;
      } else if (typeof optionsOrCallback === "function") {
        cb = optionsOrCallback;
      }
    } else if (typeof ttlOrCallback === "function") {
      cb = ttlOrCallback;
    }

    if (cb) {
      try {
        const lockId = await this.acquireLock(resource, ttl, options);
        if (!lockId) {
          cb(new Error(`Failed to acquire lock for resource: ${resource}`));
          return;
        }

        try {
          const result = await task();
          cb(null, result);
        } finally {
          await this.releaseLock(resource, lockId);
        }
      } catch (error) {
        cb(error as Error);
      }
      return;
    }

    const lockId = await this.acquireLock(resource, ttl, options);
    if (!lockId) {
      throw new Error(`Failed to acquire lock for resource: ${resource}`);
    }

    try {
      return await task();
    } finally {
      await this.releaseLock(resource, lockId);
    }
  }

  // Publish message to channel
  async publish(channel: string, message: any): Promise<number>;
  async publish(
    channel: string,
    message: any,
    callback: RedisCallback<number>
  ): Promise<void>;
  async publish(
    channel: string,
    message: any,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    const channelKey = `${this.channelPrefix}${channel}`;
    const serializedMessage =
      typeof message === "string" ? message : JSON.stringify(message);

    if (callback) {
      try {
        const result = await this.redis.send("PUBLISH", [
          channelKey,
          serializedMessage,
        ]);
        callback(null, result as number);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const result = await this.redis.send("PUBLISH", [
      channelKey,
      serializedMessage,
    ]);
    return result as number;
  }

  // Get all active locks
  async getActiveLocks(): Promise<
    Array<{ resource: string; lockId: string; ttl: number }>
  >;
  async getActiveLocks(
    callback: RedisCallback<
      Array<{ resource: string; lockId: string; ttl: number }>
    >
  ): Promise<void>;
  async getActiveLocks(
    callback?: RedisCallback<
      Array<{ resource: string; lockId: string; ttl: number }>
    >
  ): Promise<Array<{ resource: string; lockId: string; ttl: number }> | void> {
    if (callback) {
      try {
        const pattern = `${this.lockPrefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];
        const locks: Array<{ resource: string; lockId: string; ttl: number }> =
          [];

        for (const key of keys) {
          const [lockId, ttl] = await Promise.all([
            this.redis.get(key),
            this.redis.ttl(key),
          ]);

          if (lockId) {
            const resource = key.replace(this.lockPrefix, "");
            locks.push({
              resource,
              lockId: lockId,
              ttl: ttl,
            });
          }
        }

        callback(null, locks);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const pattern = `${this.lockPrefix}*`;
    const keys = (await this.redis.send("KEYS", [pattern])) as string[];
    const locks: Array<{ resource: string; lockId: string; ttl: number }> = [];

    for (const key of keys) {
      const [lockId, ttl] = await Promise.all([
        this.redis.get(key),
        this.redis.ttl(key),
      ]);

      if (lockId) {
        const resource = key.replace(this.lockPrefix, "");
        locks.push({
          resource,
          lockId: lockId,
          ttl: ttl,
        });
      }
    }

    return locks;
  }

  // Cleanup expired locks
  async cleanupLocks(): Promise<number>;
  async cleanupLocks(callback: RedisCallback<number>): Promise<void>;
  async cleanupLocks(callback?: RedisCallback<number>): Promise<number | void> {
    if (callback) {
      try {
        const pattern = `${this.lockPrefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];
        let cleanedCount = 0;

        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl === -1 || ttl === -2) {
            // No expiration or key doesn't exist
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

    const pattern = `${this.lockPrefix}*`;
    const keys = (await this.redis.send("KEYS", [pattern])) as string[];
    let cleanedCount = 0;

    for (const key of keys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1 || ttl === -2) {
        // No expiration or key doesn't exist
        await this.redis.del(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }
}
