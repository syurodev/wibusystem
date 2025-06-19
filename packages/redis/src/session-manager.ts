import { getCurrentUnixTimestamp } from "@repo/utils";
import type { RedisClient } from "./redis-client";
import type { RedisCallback, SessionData, SessionOptions } from "./types";

export class SessionManager {
  private readonly redis: RedisClient;
  private readonly defaultTTL: number;
  private readonly prefix: string;
  private readonly userIndexPrefix: string;
  private readonly deviceIndexPrefix: string;

  constructor(redis: RedisClient, options: SessionOptions = {}) {
    this.redis = redis;
    this.defaultTTL = options.ttl ?? 86400; // 24 hours default
    this.prefix = options.prefix ?? "session:";
    this.userIndexPrefix = `${this.prefix}user:`;
    this.deviceIndexPrefix = `${this.prefix}device:`;
  }

  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  private getUserIndexKey(userId: number): string {
    return `${this.userIndexPrefix}${userId}`;
  }

  private getDeviceIndexKey(deviceId: string): string {
    return `${this.deviceIndexPrefix}${deviceId}`;
  }

  private getUserDeviceIndexKey(userId: number, deviceId: string): string {
    return `${this.userIndexPrefix}${userId}:device:${deviceId}`;
  }

  private generateSessionId(): string {
    // Tạo session ID an toàn
    const timestamp = getCurrentUnixTimestamp().toString();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  // Tạo session mới
  async create(
    userId: number,
    deviceId: string,
    data: Record<string, any> = {},
    ttl: number = this.defaultTTL
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionKey = this.getKey(sessionId);

    const sessionData: SessionData = {
      userId,
      deviceId,
      data,
      createdAt: getCurrentUnixTimestamp(),
      expiresAt: getCurrentUnixTimestamp() + ttl,
    };

    // Lưu session data
    await this.redis.set(sessionKey, JSON.stringify(sessionData), ttl);

    // Tạo indexes cho user, device và user-device combination
    const userIndexKey = this.getUserIndexKey(userId);
    const deviceIndexKey = this.getDeviceIndexKey(deviceId);
    const userDeviceIndexKey = this.getUserDeviceIndexKey(userId, deviceId);

    // Thêm sessionId vào các index sets
    await Promise.all([
      this.redis.sadd(userIndexKey, sessionId),
      this.redis.sadd(deviceIndexKey, sessionId),
      this.redis.sadd(userDeviceIndexKey, sessionId),
      // Set expiration cho các index keys
      this.redis.expire(userIndexKey, ttl + 3600), // Thêm 1 giờ để cleanup
      this.redis.expire(deviceIndexKey, ttl + 3600),
      this.redis.expire(userDeviceIndexKey, ttl + 3600),
    ]);

    return sessionId;
  }

  // Lấy session
  async get(sessionId: string): Promise<SessionData | null>;
  async get(
    sessionId: string,
    callback: RedisCallback<SessionData | null>
  ): Promise<void>;
  async get(
    sessionId: string,
    callback?: RedisCallback<SessionData | null>
  ): Promise<SessionData | null | void> {
    const sessionKey = this.getKey(sessionId);

    if (callback) {
      return this.redis.get(sessionKey, (error, result) => {
        if (error) {
          callback(error);
          return;
        }

        if (!result) {
          callback(null, null);
          return;
        }

        try {
          const sessionData = JSON.parse(result) as SessionData;

          // Kiểm tra expiration
          if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
            this.destroy(sessionId); // Clean up expired session
            callback(null, null);
            return;
          }

          callback(null, sessionData);
        } catch (parseError) {
          callback(parseError as Error);
        }
      });
    }

    const result = await this.redis.get(sessionKey);
    if (!result) return null;

    try {
      const sessionData = JSON.parse(result) as SessionData;

      // Kiểm tra expiration
      if (sessionData.expiresAt && Date.now() > sessionData.expiresAt) {
        await this.destroy(sessionId); // Clean up expired session
        return null;
      }

      return sessionData;
    } catch (error) {
      throw new Error(
        `Failed to parse session data for ${sessionId}: ${error}`
      );
    }
  }

  // Update session data
  async update(
    sessionId: string,
    data: Partial<Record<string, any>>
  ): Promise<boolean>;
  async update(
    sessionId: string,
    data: Partial<Record<string, any>>,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async update(
    sessionId: string,
    data: Partial<Record<string, any>>,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    if (callback) {
      try {
        const session = await this.get(sessionId);
        if (!session) {
          callback(null, false);
          return;
        }

        session.data = { ...session.data, ...data };
        const sessionKey = this.getKey(sessionId);
        await this.redis.set(sessionKey, JSON.stringify(session));
        callback(null, true);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const session = await this.get(sessionId);
    if (!session) return false;

    session.data = { ...session.data, ...data };
    const sessionKey = this.getKey(sessionId);
    await this.redis.set(sessionKey, JSON.stringify(session));
    return true;
  }

  // Refresh session TTL
  async refresh(sessionId: string, ttl?: number): Promise<boolean>;
  async refresh(
    sessionId: string,
    ttl: number,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async refresh(
    sessionId: string,
    ttlOrCallback?: number | RedisCallback<boolean>,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const sessionKey = this.getKey(sessionId);
    const expireTime =
      typeof ttlOrCallback === "number" ? ttlOrCallback : this.defaultTTL;
    const cb = typeof ttlOrCallback === "function" ? ttlOrCallback : callback;

    if (cb) {
      try {
        // Update expiration time in session data
        const session = await this.get(sessionId);
        if (!session) {
          cb(null, false);
          return;
        }

        session.expiresAt = Date.now() + expireTime * 1000;
        await this.redis.set(sessionKey, JSON.stringify(session), expireTime);
        cb(null, true);
      } catch (error) {
        cb(error as Error);
      }
      return;
    }

    // Update expiration time in session data
    const session = await this.get(sessionId);
    if (!session) return false;

    session.expiresAt = Date.now() + expireTime * 1000;
    await this.redis.set(sessionKey, JSON.stringify(session), expireTime);
    return true;
  }

  // Destroy session
  async destroy(sessionId: string): Promise<boolean>;
  async destroy(
    sessionId: string,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async destroy(
    sessionId: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    const sessionKey = this.getKey(sessionId);

    if (callback) {
      try {
        // Lấy session data để xóa khỏi indexes
        const sessionData = await this.get(sessionId);
        if (sessionData) {
          const userIndexKey = this.getUserIndexKey(sessionData.userId);
          const deviceIndexKey = this.getDeviceIndexKey(sessionData.deviceId);
          const userDeviceIndexKey = this.getUserDeviceIndexKey(
            sessionData.userId,
            sessionData.deviceId
          );

          // Xóa khỏi indexes
          await Promise.all([
            this.redis.srem(userIndexKey, sessionId),
            this.redis.srem(deviceIndexKey, sessionId),
            this.redis.srem(userDeviceIndexKey, sessionId),
          ]);
        }

        return this.redis.del(sessionKey, (error, result) => {
          if (error) {
            callback(error);
            return;
          }
          callback(null, (result as number) > 0);
        });
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    // Lấy session data để xóa khỏi indexes
    const sessionData = await this.get(sessionId);
    if (sessionData) {
      const userIndexKey = this.getUserIndexKey(sessionData.userId);
      const deviceIndexKey = this.getDeviceIndexKey(sessionData.deviceId);
      const userDeviceIndexKey = this.getUserDeviceIndexKey(
        sessionData.userId,
        sessionData.deviceId
      );

      // Xóa khỏi indexes
      await Promise.all([
        this.redis.srem(userIndexKey, sessionId),
        this.redis.srem(deviceIndexKey, sessionId),
        this.redis.srem(userDeviceIndexKey, sessionId),
      ]);
    }

    const result = await this.redis.del(sessionKey);
    return result > 0;
  }

  // Destroy all sessions của user
  async destroyUserSessions(userId: number): Promise<number>;
  async destroyUserSessions(
    userId: number,
    callback: RedisCallback<number>
  ): Promise<void>;
  async destroyUserSessions(
    userId: number,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    const userIndexKey = this.getUserIndexKey(userId);

    if (callback) {
      try {
        // Sử dụng index để lấy danh sách session của user
        const sessionIds = (await this.redis.send("SMEMBERS", [
          userIndexKey,
        ])) as string[];

        let deletedCount = 0;
        for (const sessionId of sessionIds) {
          const destroyed = await this.destroy(sessionId);
          if (destroyed) {
            deletedCount++;
          }
        }

        // Xóa user index
        await this.redis.del(userIndexKey);
        callback(null, deletedCount);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    // Sử dụng index để lấy danh sách session của user
    const sessionIds = (await this.redis.send("SMEMBERS", [
      userIndexKey,
    ])) as string[];

    let deletedCount = 0;
    for (const sessionId of sessionIds) {
      const destroyed = await this.destroy(sessionId);
      if (destroyed) {
        deletedCount++;
      }
    }

    // Xóa user index
    await this.redis.del(userIndexKey);
    return deletedCount;
  }

  // Check if session exists và valid
  async exists(sessionId: string): Promise<boolean>;
  async exists(
    sessionId: string,
    callback: RedisCallback<boolean>
  ): Promise<void>;
  async exists(
    sessionId: string,
    callback?: RedisCallback<boolean>
  ): Promise<boolean | void> {
    if (callback) {
      try {
        const session = await this.get(sessionId);
        callback(null, session !== null);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const session = await this.get(sessionId);
    return session !== null;
  }

  // Get all sessions của user
  async getUserSessions(
    userId: number
  ): Promise<Array<{ sessionId: string; data: SessionData }>>;
  async getUserSessions(
    userId: number,
    callback: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<void>;
  async getUserSessions(
    userId: number,
    callback?: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<Array<{ sessionId: string; data: SessionData }> | void> {
    const userIndexKey = this.getUserIndexKey(userId);

    if (callback) {
      try {
        // Sử dụng index để lấy danh sách session của user
        const sessionIds = (await this.redis.send("SMEMBERS", [
          userIndexKey,
        ])) as string[];
        const userSessions: Array<{ sessionId: string; data: SessionData }> =
          [];

        for (const sessionId of sessionIds) {
          const sessionData = await this.get(sessionId);
          if (sessionData) {
            userSessions.push({ sessionId, data: sessionData });
          }
        }

        callback(null, userSessions);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    // Sử dụng index để lấy danh sách session của user
    const sessionIds = (await this.redis.send("SMEMBERS", [
      userIndexKey,
    ])) as string[];
    const userSessions: Array<{ sessionId: string; data: SessionData }> = [];

    for (const sessionId of sessionIds) {
      const sessionData = await this.get(sessionId);
      if (sessionData) {
        userSessions.push({ sessionId, data: sessionData });
      }
    }

    return userSessions;
  }

  // Get all sessions của device
  async getDeviceSessions(
    deviceId: string
  ): Promise<Array<{ sessionId: string; data: SessionData }>>;
  async getDeviceSessions(
    deviceId: string,
    callback: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<void>;
  async getDeviceSessions(
    deviceId: string,
    callback?: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<Array<{ sessionId: string; data: SessionData }> | void> {
    const deviceIndexKey = this.getDeviceIndexKey(deviceId);

    if (callback) {
      try {
        const sessionIds = (await this.redis.send("SMEMBERS", [
          deviceIndexKey,
        ])) as string[];
        const deviceSessions: Array<{ sessionId: string; data: SessionData }> =
          [];

        for (const sessionId of sessionIds) {
          const sessionData = await this.get(sessionId);
          if (sessionData) {
            deviceSessions.push({ sessionId, data: sessionData });
          }
        }

        callback(null, deviceSessions);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const sessionIds = (await this.redis.send("SMEMBERS", [
      deviceIndexKey,
    ])) as string[];
    const deviceSessions: Array<{ sessionId: string; data: SessionData }> = [];

    for (const sessionId of sessionIds) {
      const sessionData = await this.get(sessionId);
      if (sessionData) {
        deviceSessions.push({ sessionId, data: sessionData });
      }
    }

    return deviceSessions;
  }

  // Destroy all sessions của device
  async destroyDeviceSessions(deviceId: string): Promise<number>;
  async destroyDeviceSessions(
    deviceId: string,
    callback: RedisCallback<number>
  ): Promise<void>;
  async destroyDeviceSessions(
    deviceId: string,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    const deviceIndexKey = this.getDeviceIndexKey(deviceId);

    if (callback) {
      try {
        const sessionIds = (await this.redis.send("SMEMBERS", [
          deviceIndexKey,
        ])) as string[];

        let deletedCount = 0;
        for (const sessionId of sessionIds) {
          const destroyed = await this.destroy(sessionId);
          if (destroyed) {
            deletedCount++;
          }
        }

        await this.redis.del(deviceIndexKey);
        callback(null, deletedCount);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const sessionIds = (await this.redis.send("SMEMBERS", [
      deviceIndexKey,
    ])) as string[];

    let deletedCount = 0;
    for (const sessionId of sessionIds) {
      const destroyed = await this.destroy(sessionId);
      if (destroyed) {
        deletedCount++;
      }
    }

    await this.redis.del(deviceIndexKey);
    return deletedCount;
  }

  // Get sessions của user trên device cụ thể
  async getUserDeviceSessions(
    userId: number,
    deviceId: string
  ): Promise<Array<{ sessionId: string; data: SessionData }>>;
  async getUserDeviceSessions(
    userId: number,
    deviceId: string,
    callback: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<void>;
  async getUserDeviceSessions(
    userId: number,
    deviceId: string,
    callback?: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<Array<{ sessionId: string; data: SessionData }> | void> {
    const userDeviceIndexKey = this.getUserDeviceIndexKey(userId, deviceId);

    if (callback) {
      try {
        const sessionIds = (await this.redis.send("SMEMBERS", [
          userDeviceIndexKey,
        ])) as string[];
        const sessions: Array<{ sessionId: string; data: SessionData }> = [];

        for (const sessionId of sessionIds) {
          const sessionData = await this.get(sessionId);
          if (sessionData) {
            sessions.push({ sessionId, data: sessionData });
          }
        }

        callback(null, sessions);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const sessionIds = (await this.redis.send("SMEMBERS", [
      userDeviceIndexKey,
    ])) as string[];
    const sessions: Array<{ sessionId: string; data: SessionData }> = [];

    for (const sessionId of sessionIds) {
      const sessionData = await this.get(sessionId);
      if (sessionData) {
        sessions.push({ sessionId, data: sessionData });
      }
    }

    return sessions;
  }

  // Destroy sessions của user trên device cụ thể
  async destroyUserDeviceSessions(
    userId: number,
    deviceId: string
  ): Promise<number>;
  async destroyUserDeviceSessions(
    userId: number,
    deviceId: string,
    callback: RedisCallback<number>
  ): Promise<void>;
  async destroyUserDeviceSessions(
    userId: number,
    deviceId: string,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    const userDeviceIndexKey = this.getUserDeviceIndexKey(userId, deviceId);

    if (callback) {
      try {
        const sessionIds = (await this.redis.send("SMEMBERS", [
          userDeviceIndexKey,
        ])) as string[];

        let deletedCount = 0;
        for (const sessionId of sessionIds) {
          const destroyed = await this.destroy(sessionId);
          if (destroyed) {
            deletedCount++;
          }
        }

        await this.redis.del(userDeviceIndexKey);
        callback(null, deletedCount);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const sessionIds = (await this.redis.send("SMEMBERS", [
      userDeviceIndexKey,
    ])) as string[];

    let deletedCount = 0;
    for (const sessionId of sessionIds) {
      const destroyed = await this.destroy(sessionId);
      if (destroyed) {
        deletedCount++;
      }
    }

    await this.redis.del(userDeviceIndexKey);
    return deletedCount;
  }

  // Cleanup expired sessions và indexes
  async cleanup(): Promise<number>;
  async cleanup(callback: RedisCallback<number>): Promise<void>;
  async cleanup(callback?: RedisCallback<number>): Promise<number | void> {
    if (callback) {
      try {
        const pattern = `${this.prefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];
        let cleanedCount = 0;

        for (const key of keys) {
          // Skip index keys
          if (key.includes(":user:") || key.includes(":device:")) {
            continue;
          }

          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData) as SessionData;
              if (
                parsed.expiresAt &&
                getCurrentUnixTimestamp() > parsed.expiresAt
              ) {
                const sessionId = key.replace(this.prefix, "");
                await this.destroy(sessionId); // Sử dụng destroy để xóa cả indexes
                cleanedCount++;
              }
            } catch {
              // Clean up invalid session data
              const sessionId = key.replace(this.prefix, "");
              await this.destroy(sessionId);
              cleanedCount++;
            }
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
      // Skip index keys
      if (key.includes(":user:") || key.includes(":device:")) {
        continue;
      }

      const sessionData = await this.redis.get(key);
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData) as SessionData;
          if (
            parsed.expiresAt &&
            getCurrentUnixTimestamp() > parsed.expiresAt
          ) {
            const sessionId = key.replace(this.prefix, "");
            await this.destroy(sessionId); // Sử dụng destroy để xóa cả indexes
            cleanedCount++;
          }
        } catch {
          // Clean up invalid session data
          const sessionId = key.replace(this.prefix, "");
          await this.destroy(sessionId);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }
}
