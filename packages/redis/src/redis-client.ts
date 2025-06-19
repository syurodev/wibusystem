import { RedisConnectionPool } from "./connection-pool";
import type {
  RedisCallback,
  RedisConfig,
  RedisEvents,
  RedisKey,
  RedisValue,
} from "./types";

export class RedisClient {
  private pool: RedisConnectionPool;
  private config: RedisConfig;
  private events: Partial<RedisEvents> = {};

  constructor(config: RedisConfig = {}) {
    this.config = {
      url: process.env.REDIS_URL || "redis://localhost:6379",
      maxConnections: 10,
      connectionTimeout: 10000,
      idleTimeout: 30000,
      autoReconnect: true,
      maxRetries: 10,
      enableOfflineQueue: true,
      enableAutoPipelining: true,
      ...config,
    };

    this.pool = new RedisConnectionPool(this.config);

    // Cleanup idle connections every 30 seconds
    setInterval(() => {
      this.pool.cleanup();
    }, 30000);
  }

  // Event handlers
  on<K extends keyof RedisEvents>(event: K, handler: RedisEvents[K]): void {
    this.events[event] = handler;
  }

  off<K extends keyof RedisEvents>(event: K): void {
    delete this.events[event];
  }

  private emit<K extends keyof RedisEvents>(event: K, ...args: any[]): void {
    const handler = this.events[event];
    if (handler) {
      (handler as any)(...args);
    }
  }

  // Basic operations với callback support
  async set(key: RedisKey, value: RedisValue, ttl?: number): Promise<string>;
  async set(
    key: RedisKey,
    value: RedisValue,
    callback: RedisCallback<string>
  ): Promise<void>;
  async set(
    key: RedisKey,
    value: RedisValue,
    ttl: number,
    callback: RedisCallback<string>
  ): Promise<void>;
  async set(
    key: RedisKey,
    value: RedisValue,
    ttlOrCallback?: number | RedisCallback<string>,
    callback?: RedisCallback<string>
  ): Promise<string | void> {
    return this.executeCommand(
      async (connection) => {
        let result: string;

        if (typeof ttlOrCallback === "number") {
          // SET with TTL
          result = await connection.client.set(key, String(value));
          await connection.client.expire(key, ttlOrCallback);
        } else {
          // Basic SET
          result = await connection.client.set(key, String(value));
        }

        return result;
      },
      (ttlOrCallback as RedisCallback<string>) || callback
    );
  }

  async get(key: RedisKey): Promise<string | null>;
  async get(
    key: RedisKey,
    callback: RedisCallback<string | null>
  ): Promise<void>;
  async get(
    key: RedisKey,
    callback?: RedisCallback<string | null>
  ): Promise<string | null | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.get(key);
    }, callback);
  }

  async del(key: RedisKey | RedisKey[]): Promise<number>;
  async del(
    key: RedisKey | RedisKey[],
    callback: RedisCallback<number>
  ): Promise<void>;
  async del(
    key: RedisKey | RedisKey[],
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      if (Array.isArray(key)) {
        return await connection.client.send("DEL", key);
      }
      return await connection.client.del(key);
    }, callback);
  }

  async exists(key: RedisKey): Promise<boolean>;
  async exists(key: RedisKey, callback: RedisCallback<boolean>): Promise<void>;
  async exists(
    key: RedisKey,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.exists(key);
    }, callback);
  }

  async expire(key: RedisKey, seconds: number): Promise<boolean>;
  async expire(
    key: RedisKey,
    seconds: number,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async expire(
    key: RedisKey,
    seconds: number,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.expire(key, seconds);
    }, callback);
  }

  async ttl(key: RedisKey): Promise<number>;
  async ttl(key: RedisKey, callback: RedisCallback<number>): Promise<void>;
  async ttl(
    key: RedisKey,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.ttl(key);
    }, callback);
  }

  // Increment operations
  async incr(key: RedisKey): Promise<number>;
  async incr(key: RedisKey, callback: RedisCallback<number>): Promise<void>;
  async incr(
    key: RedisKey,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.incr(key);
    }, callback);
  }

  async incrby(key: RedisKey, increment: number): Promise<number>;
  async incrby(
    key: RedisKey,
    increment: number,
    callback: RedisCallback<number>
  ): Promise<void>;
  async incrby(
    key: RedisKey,
    increment: number,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.send("INCRBY", [
        key,
        increment.toString(),
      ]);
    }, callback);
  }

  async decr(key: RedisKey): Promise<number>;
  async decr(key: RedisKey, callback: RedisCallback<number>): Promise<void>;
  async decr(
    key: RedisKey,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.decr(key);
    }, callback);
  }

  // Hash operations
  async hset(key: RedisKey, field: string, value: RedisValue): Promise<number>;
  async hset(
    key: RedisKey,
    field: string,
    value: RedisValue,
    callback: RedisCallback<number>
  ): Promise<void>;
  async hset(
    key: RedisKey,
    field: string,
    value: RedisValue,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.send("HSET", [key, field, String(value)]);
    }, callback);
  }

  async hget(key: RedisKey, field: string): Promise<string | null>;
  async hget(
    key: RedisKey,
    field: string,
    callback: RedisCallback<string | null>
  ): Promise<void>;
  async hget(
    key: RedisKey,
    field: string,
    callback?: RedisCallback<string | null>
  ): Promise<string | null | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.send("HGET", [key, field]);
    }, callback);
  }

  async hmset(key: RedisKey, ...fieldValues: string[]): Promise<string>;
  async hmset(
    key: RedisKey,
    fieldValues: string[],
    callback: RedisCallback<string>
  ): Promise<void>;
  async hmset(
    key: RedisKey,
    fieldValuesOrCallback: string[] | string,
    ...rest: any[]
  ): Promise<string | void> {
    let fieldValues: string[];
    let callback: RedisCallback<string> | undefined;

    if (Array.isArray(fieldValuesOrCallback)) {
      fieldValues = fieldValuesOrCallback;
      callback = rest[0];
    } else {
      fieldValues = [fieldValuesOrCallback, ...rest.slice(0, -1)];
      const lastArg = rest[rest.length - 1];
      if (typeof lastArg === "function") {
        callback = lastArg;
      } else if (lastArg !== undefined) {
        fieldValues.push(lastArg);
      }
    }

    return this.executeCommand(async (connection) => {
      return await connection.client.hmset(key, fieldValues);
    }, callback);
  }

  async hmget(key: RedisKey, fields: string[]): Promise<(string | null)[]>;
  async hmget(
    key: RedisKey,
    fields: string[],
    callback: RedisCallback<(string | null)[]>
  ): Promise<void>;
  async hmget(
    key: RedisKey,
    fields: string[],
    callback?: RedisCallback<(string | null)[]>
  ): Promise<(string | null)[] | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.hmget(key, fields);
    }, callback);
  }

  // Set operations
  async sadd(key: RedisKey, member: RedisValue): Promise<number>;
  async sadd(
    key: RedisKey,
    member: RedisValue,
    callback: RedisCallback<number>
  ): Promise<void>;
  async sadd(
    key: RedisKey,
    member: RedisValue,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.sadd(key, String(member));
    }, callback);
  }

  async srem(key: RedisKey, member: RedisValue): Promise<number>;
  async srem(
    key: RedisKey,
    member: RedisValue,
    callback: RedisCallback<number>
  ): Promise<void>;
  async srem(
    key: RedisKey,
    member: RedisValue,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.srem(key, String(member));
    }, callback);
  }

  async sismember(key: RedisKey, member: RedisValue): Promise<boolean>;
  async sismember(
    key: RedisKey,
    member: RedisValue,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async sismember(
    key: RedisKey,
    member: RedisValue,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    return this.executeCommand(async (connection) => {
      return await connection.client.sismember(key, String(member));
    }, callback);
  }

  // Raw command execution
  async send(command: string, args: string[]): Promise<any>;
  async send(
    command: string,
    args: string[],
    callback: RedisCallback
  ): Promise<void>;
  async send(
    command: string,
    args: string[],
    callback?: RedisCallback
  ): Promise<any> {
    return this.executeCommand(async (connection) => {
      return await connection.client.send(command, args);
    }, callback);
  }

  // Execute command với connection pooling
  private async executeCommand<T>(
    operation: (connection: any) => Promise<T>,
    callback?: RedisCallback<T>
  ): Promise<T | void> {
    let connection;

    try {
      connection = await this.pool.acquire();
      const result = await operation(connection);

      if (callback) {
        callback(null, result);
        return;
      }

      return result;
    } catch (error) {
      const redisError =
        error instanceof Error ? error : new Error(String(error));

      this.emit("error", redisError);

      if (callback) {
        callback(redisError);
        return;
      }

      throw redisError;
    } finally {
      if (connection) {
        this.pool.release(connection);
      }
    }
  }

  // Connection management
  async connect(): Promise<void> {
    try {
      // Test connection
      const connection = await this.pool.acquire();
      this.pool.release(connection);
      this.emit("connect");
    } catch (error) {
      this.emit("error", error as Error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.destroy();
    this.emit("disconnect");
  }

  // Status methods
  get connected(): boolean {
    return this.pool.size > 0;
  }

  get poolSize(): number {
    return this.pool.size;
  }

  get availableConnections(): number {
    return this.pool.available;
  }
}
