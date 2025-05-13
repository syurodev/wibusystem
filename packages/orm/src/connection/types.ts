/**
 * Cấu hình kết nối đến PostgreSQL
 */
export interface ConnectionConfig {
  /**
   * Tên máy chủ hoặc địa chỉ IP của PostgreSQL server
   * @default 'localhost'
   */
  host?: string;

  /**
   * Cổng kết nối đến PostgreSQL server
   * @default 5432
   */
  port?: number;

  /**
   * Tên người dùng để xác thực với PostgreSQL
   */
  user: string;

  /**
   * Mật khẩu để xác thực với PostgreSQL
   */
  password: string;

  /**
   * Tên cơ sở dữ liệu để kết nối
   */
  database: string;

  /**
   * Số lượng kết nối tối đa trong pool
   * @default 10
   */
  maxConnections?: number;

  /**
   * Thời gian tối đa (ms) để một client ở trạng thái idle trước khi bị đóng
   * @default 30000 (30 giây)
   */
  idleTimeoutMillis?: number;

  /**
   * Thời gian tối đa (ms) để chờ kết nối từ pool
   * @default 10000 (10 giây)
   */
  connectionTimeoutMillis?: number;

  /**
   * Cấu hình SSL cho kết nối
   * @default false
   */
  ssl?: boolean | object;

  /**
   * Cấu hình logging
   * @default false
   */
  logging?: LoggingConfig;
}

/**
 * Các mức độ log được hỗ trợ
 */
export type LoggingLevel = "query" | "error" | "warn" | "info" | "debug";

/**
 * Kiểu cho cấu hình logging
 * - true: Bật tất cả các log (query, error, warn, info, debug)
 * - false: Tắt tất cả các log
 * - LoggingLevel[]: Mảng các mức log cụ thể muốn bật (ví dụ: ['query', 'error'])
 * - Partial<Record<LoggingLevel, boolean>>: Object để bật/tắt từng mức log
 */
export type LoggingConfig =
  | boolean
  | LoggingLevel[]
  | { [key in LoggingLevel]?: boolean };

/**
 * Trạng thái của ConnectionManager
 */
export enum ConnectionStatus {
  DISCONNECTED = "disconnected",
  CONNECTED = "connected",
  ERROR = "error",
}
