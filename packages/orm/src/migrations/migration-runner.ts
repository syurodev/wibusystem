// Orchestrates the discovery and execution of migration files.

import * as fs from "fs/promises";
import * as path from "path";
import { ConnectionManager } from "../connection/connection-manager";
import { MigrationStorage } from "./migration-storage";
import { Migration } from "./migration.interface";

/**
 * Interface cho một file migration đã được load, bao gồm thông tin và instance.
 */
interface LoadedMigration {
  name: string; // Tên migration (từ tên file hoặc thuộc tính name của class)
  description?: string; // Mô tả từ class migration
  filePath: string; // Đường dẫn đầy đủ đến file
  instance: Migration; // Instance của class migration
}

export class MigrationRunner {
  private readonly connectionManager: ConnectionManager;
  private readonly migrationStorage: MigrationStorage;
  private readonly migrationsDir: string;

  constructor(
    connectionManager: ConnectionManager,
    migrationStorage: MigrationStorage,
    migrationsDir: string
  ) {
    this.connectionManager = connectionManager;
    this.migrationStorage = migrationStorage;
    this.migrationsDir = migrationsDir;
    // TODO: Kiểm tra xem migrationsDir có tồn tại không và có phải là thư mục không
  }

  // Các phương thức khác sẽ được thêm vào đây
  // Ví dụ: _loadMigrations, runUp, runDown

  /**
   * Load tất cả các file migration từ thư mục đã chỉ định, import chúng,
   * và tạo instance cho các class migration.
   * Các migration sẽ được sắp xếp theo tên (thường là timestamp).
   * @returns Promise chứa một mảng các LoadedMigration.
   * @throws Error nếu thư mục migrations không tồn tại hoặc có lỗi khi load file.
   */
  private async _loadMigrations(): Promise<LoadedMigration[]> {
    try {
      await fs.access(this.migrationsDir); // Kiểm tra thư mục tồn tại
    } catch (error) {
      throw new Error(
        `Thư mục migrations không tồn tại hoặc không thể truy cập: ${this.migrationsDir}`
      );
    }

    const files = await fs.readdir(this.migrationsDir);
    const migrationFiles = files.filter(
      (file) => file.endsWith(".ts") || file.endsWith(".js") // Hỗ trợ cả .ts và .js (sau khi build)
    );

    if (migrationFiles.length === 0) {
      console.log(
        "Không tìm thấy file migration nào trong thư mục:",
        this.migrationsDir
      );
      return [];
    }

    const loadedMigrations: LoadedMigration[] = [];

    for (const fileName of migrationFiles) {
      const filePath = path.join(this.migrationsDir, fileName);
      try {
        const migrationModule = await import(filePath); // Dynamic import

        // Tìm class migration được export
        // Giả định class migration là export default hoặc là class duy nhất được export có tên chứa 'Migration'
        let MigrationClass: any = null;
        if (
          migrationModule.default &&
          typeof migrationModule.default === "function"
        ) {
          MigrationClass = migrationModule.default;
        } else {
          for (const exportName in migrationModule) {
            if (
              typeof migrationModule[exportName] === "function" &&
              migrationModule[exportName].prototype instanceof Object &&
              migrationModule[exportName].name.includes("Migration")
            ) {
              MigrationClass = migrationModule[exportName];
              break;
            }
          }
        }

        if (!MigrationClass) {
          console.warn(
            `Không tìm thấy class migration nào được export trong file: ${filePath}`
          );
          continue;
        }

        const instance = new MigrationClass() as Migration;

        // Kiểm tra xem instance có thực sự implement Migration không (kiểm tra các thuộc tính và phương thức cần thiết)
        if (
          !instance ||
          typeof instance.name !== "string" ||
          typeof instance.up !== "function" ||
          typeof instance.down !== "function"
        ) {
          console.warn(
            `Class trong file ${filePath} không phải là một Migration hợp lệ.`
          );
          continue;
        }

        loadedMigrations.push({
          name: instance.name, // Lấy tên từ instance
          description: instance.description,
          filePath,
          instance,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Lỗi khi load migration file '${filePath}': ${message}`);
        // Quyết định xem có nên throw lỗi và dừng toàn bộ quá trình không, hay chỉ bỏ qua file lỗi
        // Hiện tại, sẽ bỏ qua file lỗi và tiếp tục với các file khác.
      }
    }

    // Sắp xếp các migration theo tên (thường là timestamp)
    loadedMigrations.sort((a, b) => a.name.localeCompare(b.name));

    return loadedMigrations;
  }
}
