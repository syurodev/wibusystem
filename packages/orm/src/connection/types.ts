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
  logging?: boolean | string[] | ((message: string) => void);
}

/**
 * Trạng thái của ConnectionManager
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTED = 'connected',
  ERROR = 'error'
}
