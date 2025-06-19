import { RedisClient } from "bun";
import type { ConnectionPool, RedisConfig, RedisConnection } from "./types";
import { ConnectionError } from "./types";

class BunRedisConnection implements RedisConnection {
  public id: string;
  public client: RedisClient;
  public connected: boolean = false;
  public lastUsed: number = Date.now();

  constructor(config: RedisConfig) {
    this.id = Math.random().toString(36).substring(7);
    this.client = new RedisClient(config.url || "redis://localhost:6379", {
      connectionTimeout: config.connectionTimeout || 10000,
      idleTimeout: config.idleTimeout || 30000,
      autoReconnect: config.autoReconnect ?? true,
      maxRetries: config.maxRetries || 10,
      enableOfflineQueue: config.enableOfflineQueue ?? true,
      enableAutoPipelining: config.enableAutoPipelining ?? true,
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.connected = true;
      this.lastUsed = Date.now();
    } catch (error) {
      this.connected = false;
      throw new ConnectionError(`Failed to connect: ${error}`);
    }
  }

  disconnect(): void {
    this.client.close();
    this.connected = false;
  }
}

export class RedisConnectionPool implements ConnectionPool {
  private connections: RedisConnection[] = [];
  private availableConnections: RedisConnection[] = [];
  private config: RedisConfig;
  private maxConnections: number;

  constructor(config: RedisConfig = {}) {
    this.config = config;
    this.maxConnections = config.maxConnections || 10;
  }

  async acquire(): Promise<RedisConnection> {
    // Tìm connection available
    let connection = this.availableConnections.pop();

    if (connection && connection.connected) {
      connection.lastUsed = Date.now();
      return connection;
    }

    // Tạo connection mới nếu chưa đạt max
    if (this.connections.length < this.maxConnections) {
      connection = new BunRedisConnection(this.config);
      await connection.connect();
      this.connections.push(connection);
      return connection;
    }

    // Đợi connection available
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const available = this.availableConnections.pop();
        if (available && available.connected) {
          clearInterval(checkInterval);
          available.lastUsed = Date.now();
          resolve(available);
        }
      }, 10);

      // Timeout sau 5 giây
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new ConnectionError("Pool timeout: no connections available"));
      }, 5000);
    });
  }

  release(connection: RedisConnection): void {
    if (connection.connected) {
      this.availableConnections.push(connection);
    } else {
      // Remove disconnected connection
      const index = this.connections.indexOf(connection);
      if (index > -1) {
        this.connections.splice(index, 1);
      }
    }
  }

  async destroy(): Promise<void> {
    // Đóng tất cả connections
    for (const connection of this.connections) {
      connection.disconnect();
    }
    this.connections = [];
    this.availableConnections = [];
  }

  get size(): number {
    return this.connections.length;
  }

  get available(): number {
    return this.availableConnections.length;
  }

  // Cleanup idle connections
  cleanup(): void {
    const now = Date.now();
    const idleTimeout = this.config.idleTimeout || 30000;

    this.availableConnections = this.availableConnections.filter((conn) => {
      const isIdle = now - conn.lastUsed > idleTimeout;
      if (isIdle) {
        conn.disconnect();
        const index = this.connections.indexOf(conn);
        if (index > -1) {
          this.connections.splice(index, 1);
        }
        return false;
      }
      return true;
    });
  }
}
