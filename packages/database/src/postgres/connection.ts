import { SQL } from "bun";

export interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
  // Connection pool options (theo tài liệu chính thức)
  max?: number;
  idle_timeout?: number;
  max_lifetime?: number;
  // Connection options
  connection_timeout?: number;
  // SSL options
  ssl?: boolean | "require" | "prefer" | "disable";
  // Query options
  prepare?: boolean;
  bigint?: boolean;
}

export class PostgresConnectionManager {
  private _sql: SQL | null = null;
  private readonly config: PostgresConfig;

  constructor(config: PostgresConfig) {
    this.config = {
      max: 20,
      idle_timeout: 300, // 5 minutes (in seconds)
      max_lifetime: 3600, // 1 hour (in seconds)
      connection_timeout: 10, // 10 seconds
      ssl: false,
      prepare: true,
      bigint: true,
      ...config,
    };
  }

  /**
   * Lấy instance SQL connection (lazy initialization)
   */
  get sql(): SQL {
    this._sql ??= this.createConnection();
    return this._sql;
  }

  /**
   * Tạo connection đến PostgreSQL theo tài liệu chính thức
   */
  private createConnection(): SQL {
    const { url, host, port, database, username, password, ssl, ...options } =
      this.config;

    // Nếu có URL sẵn thì dùng URL
    if (url) {
      return new SQL(url, {
        max: options.max,
        idle_timeout: options.idle_timeout,
        max_lifetime: options.max_lifetime,
        connection_timeout: options.connection_timeout,
        prepare: options.prepare,
        bigint: options.bigint,
      });
    }

    // Tạo connection string với SSL options
    let connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}`;

    if (ssl === "require") {
      connectionString += "?sslmode=require";
    } else if (ssl === "prefer") {
      connectionString += "?sslmode=prefer";
    } else if (ssl === "disable") {
      connectionString += "?sslmode=disable";
    } else if (ssl === true) {
      connectionString += "?sslmode=require";
    }

    return new SQL(connectionString, {
      max: options.max,
      idle_timeout: options.idle_timeout,
      max_lifetime: options.max_lifetime,
      connection_timeout: options.connection_timeout,
      prepare: options.prepare,
      bigint: options.bigint,
    });
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.sql`SELECT 1 as test`;
      return true;
    } catch (error) {
      console.error("Database connection failed:", error);
      return false;
    }
  }

  /**
   * Close all connections
   */
  async close(timeout = 5): Promise<void> {
    if (this._sql) {
      await this._sql.close({ timeout });
      this._sql = null;
    }
  }

  /**
   * Execute migrations sử dụng unsafe() method cho multiple statements
   */
  async migrate(migrations: string[]): Promise<void> {
    for (const migration of migrations) {
      try {
        // Sử dụng unsafe() cho multiple statements - CẢNH BÁO: chỉ dùng với trusted input
        await this.sql.unsafe(migration);
        console.log(`✅ Migration executed successfully`);
      } catch (error) {
        console.error(`❌ Migration failed:`, error);
        throw error;
      }
    }
  }

  /**
   * Begin transaction theo tài liệu
   */
  async transaction<T>(callback: (tx: SQL) => Promise<T>): Promise<T> {
    return await this.sql.begin(callback);
  }

  /**
   * Reserve a connection from pool
   */
  async reserve() {
    return await this.sql.reserve();
  }

  /**
   * Get connection info
   */
  getConnectionInfo() {
    return {
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      username: this.config.username,
      maxConnections: this.config.max,
      ssl: this.config.ssl,
      prepare: this.config.prepare,
      bigint: this.config.bigint,
    };
  }
}
