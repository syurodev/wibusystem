import { OrmClient } from "./client";
import { ConnectionManager } from "./connection/connection-manager";
import { ConnectionConfig } from "./connection/types";

/**
 * Factory class để khởi tạo và quản lý ORM
 */
export class OrmFactory {
  /**
   * Khởi tạo ORM với cấu hình kết nối
   * @param config Cấu hình kết nối đến PostgreSQL
   */
  public static async initialize(config: ConnectionConfig): Promise<OrmClient> {
    const connectionManager = ConnectionManager.getInstance();
    await connectionManager.initialize(config);
    return new OrmClient(connectionManager);
  }

  /**
   * Đóng tất cả các kết nối
   */
  public static async close(): Promise<void> {
    const connectionManager = ConnectionManager.getInstance();
    await connectionManager.close();
  }
}
