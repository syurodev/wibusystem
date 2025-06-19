import type { RedisClient } from "./redis-client";
import type { RedisCallback, SessionData, SessionOptions } from "./types";

export class SessionManager {
  private redis: RedisClient;
  private defaultTTL: number;
  private prefix: string;

  constructor(redis: RedisClient, options: SessionOptions = {}) {
    this.redis = redis;
    this.defaultTTL = options.ttl || 86400; // 24 hours default
    this.prefix = options.prefix || "session:";
  }

  private getKey(sessionId: string): string {
    return `${this.prefix}${sessionId}`;
  }

  private generateSessionId(): string {
    // Tạo session ID an toàn
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}`;
  }

  // Tạo session mới
  async create(
    userId: string,
    data: Record<string, any> = {},
    ttl: number = this.defaultTTL
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionKey = this.getKey(sessionId);

    const sessionData: SessionData = {
      userId,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
    };

    await this.redis.set(sessionKey, JSON.stringify(sessionData), ttl);
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
      return this.redis.del(sessionKey, (error, result) => {
        if (error) {
          callback(error);
          return;
        }
        callback(null, (result as number) > 0);
      });
    }

    const result = await this.redis.del(sessionKey);
    return (result as number) > 0;
  }

  // Destroy all sessions của user
  async destroyUserSessions(userId: string): Promise<number>;
  async destroyUserSessions(
    userId: string,
    callback: RedisCallback<number>
  ): Promise<void>;
  async destroyUserSessions(
    userId: string,
    callback?: RedisCallback<number>
  ): Promise<number | void> {
    if (callback) {
      try {
        const pattern = `${this.prefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];

        let deletedCount = 0;
        for (const key of keys) {
          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData) as SessionData;
              if (parsed.userId === userId) {
                await this.redis.del(key);
                deletedCount++;
              }
            } catch {
              // Skip invalid session data
            }
          }
        }

        callback(null, deletedCount);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const pattern = `${this.prefix}*`;
    const keys = (await this.redis.send("KEYS", [pattern])) as string[];

    let deletedCount = 0;
    for (const key of keys) {
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData) as SessionData;
          if (parsed.userId === userId) {
            await this.redis.del(key);
            deletedCount++;
          }
        } catch {
          // Skip invalid session data
        }
      }
    }

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
    userId: string
  ): Promise<Array<{ sessionId: string; data: SessionData }>>;
  async getUserSessions(
    userId: string,
    callback: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<void>;
  async getUserSessions(
    userId: string,
    callback?: RedisCallback<Array<{ sessionId: string; data: SessionData }>>
  ): Promise<Array<{ sessionId: string; data: SessionData }> | void> {
    if (callback) {
      try {
        const pattern = `${this.prefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];
        const userSessions: Array<{ sessionId: string; data: SessionData }> =
          [];

        for (const key of keys) {
          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData) as SessionData;
              if (parsed.userId === userId) {
                const sessionId = key.replace(this.prefix, "");
                userSessions.push({ sessionId, data: parsed });
              }
            } catch {
              // Skip invalid session data
            }
          }
        }

        callback(null, userSessions);
      } catch (error) {
        callback(error as Error);
      }
      return;
    }

    const pattern = `${this.prefix}*`;
    const keys = (await this.redis.send("KEYS", [pattern])) as string[];
    const userSessions: Array<{ sessionId: string; data: SessionData }> = [];

    for (const key of keys) {
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData) as SessionData;
          if (parsed.userId === userId) {
            const sessionId = key.replace(this.prefix, "");
            userSessions.push({ sessionId, data: parsed });
          }
        } catch {
          // Skip invalid session data
        }
      }
    }

    return userSessions;
  }

  // Cleanup expired sessions
  async cleanup(): Promise<number>;
  async cleanup(callback: RedisCallback<number>): Promise<void>;
  async cleanup(callback?: RedisCallback<number>): Promise<number | void> {
    if (callback) {
      try {
        const pattern = `${this.prefix}*`;
        const keys = (await this.redis.send("KEYS", [pattern])) as string[];
        let cleanedCount = 0;

        for (const key of keys) {
          const sessionData = await this.redis.get(key);
          if (sessionData) {
            try {
              const parsed = JSON.parse(sessionData) as SessionData;
              if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
                await this.redis.del(key);
                cleanedCount++;
              }
            } catch {
              // Clean up invalid session data
              await this.redis.del(key);
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
      const sessionData = await this.redis.get(key);
      if (sessionData) {
        try {
          const parsed = JSON.parse(sessionData) as SessionData;
          if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
            await this.redis.del(key);
            cleanedCount++;
          }
        } catch {
          // Clean up invalid session data
          await this.redis.del(key);
          cleanedCount++;
        }
      }
    }

    return cleanedCount;
  }
}
