import { sql as bunSQL } from "bun";

export interface PostgresConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  url?: string;
  maxConnections?: number;
  connectionTimeout?: number;
  ssl?: boolean;
}

export class PostgresConnectionManager {
  private _sql: any = null;
  private readonly config: PostgresConfig;

  constructor(config: PostgresConfig) {
    this.config = {
      maxConnections: 20,
      connectionTimeout: 10000,
      ssl: false,
      ...config,
    };
  }

  /**
   * Lấy instance SQL connection (lazy initialization)
   */
  get sql() {
    this._sql ??= this.createConnection();
    return this._sql;
  }

  /**
   * Tạo connection đến PostgreSQL
   */
  private createConnection() {
    const { url, host, port, database, username, password, ssl } = this.config;

    // Nếu có URL sẵn thì dùng URL
    if (url) {
      return bunSQL(url);
    }

    // Tạo connection string
    const connectionString = `postgresql://${username}:${password}@${host}:${port}/${database}${ssl ? "?sslmode=require" : ""}`;

    return bunSQL(connectionString);
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
  async close(): Promise<void> {
    if (this._sql) {
      await this._sql.close();
      this._sql = null;
    }
  }

  /**
   * Execute migrations
   */
  async migrate(migrations: string[]): Promise<void> {
    for (const migration of migrations) {
      try {
        await this.sql.unsafe(migration);
        console.log(`✅ Migration executed successfully`);
      } catch (error) {
        console.error(`❌ Migration failed:`, error);
        throw error;
      }
    }
  }

  /**
   * Begin transaction
   */
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return await this.sql.begin(callback);
  }

  /**
   * Reserve a connection from pool
   */
  async reserve() {
    return await this.sql.reserve();
  }
}
