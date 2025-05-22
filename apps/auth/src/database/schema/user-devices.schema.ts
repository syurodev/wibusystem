import { InferInsertModel, InferSelectModel, sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  index,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// Nên định nghĩa DeviceType trong file enum dùng chung, ví dụ: apps/auth/src/types/enums.ts
// export enum DeviceType {
//   UNKNOWN = 0,
//   DESKTOP = 1,
//   MOBILE = 2,
//   TABLET = 3,
//   WEB_BROWSER = 4, // Dành cho các session chủ yếu trên trình duyệt
// }

/**
 * Bảng `user_devices`: Lưu trữ thông tin về các thiết bị mà người dùng đã sử dụng để đăng nhập.
 * Mỗi thiết bị được xác định bởi một fingerprint duy nhất cho mỗi người dùng.
 */
export const userDevices = pgTable(
  "user_devices",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" }).notNull().default(0), // Tham chiếu logic tới users.id

    // Một định danh duy nhất cho thiết bị, có thể do client tạo ra hoặc suy ra từ các thuộc tính ổn định.
    // Giúp nhận diện cùng một thiết bị qua các phiên đăng nhập khác nhau.
    fingerprint: varchar("fingerprint", { length: 255 }).notNull().default(""),

    // Tên do người dùng đặt cho thiết bị (ví dụ: "iPhone X của An")
    name: varchar("name", { length: 100 }).default(""),

    // Loại thiết bị (ví dụ: DESKTOP, MOBILE). Nên sử dụng enum DeviceType.
    type: smallint("type").notNull().default(0), // Mặc định là UNKNOWN

    model: varchar("model", { length: 100 }).default(""), // Ví dụ: "iPhone 15 Pro", "Galaxy Note 10"
    osName: varchar("os_name", { length: 50 }).default(""), // Ví dụ: "iOS", "Android", "Windows"
    osVersion: varchar("os_version", { length: 50 }).default(""),
    browserName: varchar("browser_name", { length: 50 }).default(""), // Nếu là trình duyệt
    browserVersion: varchar("browser_version", { length: 50 }).default(""), // Nếu là trình duyệt

    lastKnownIp: varchar("last_known_ip", { length: 45 }).default(""),
    lastUserAgent: text("last_user_agent").default(""), // User agent có thể dài

    // Người dùng có xác nhận/tin tưởng thiết bị này một cách tường minh không?
    isTrusted: smallint("is_trusted").notNull().default(0), // 0: Không, 1: Có

    // Thời điểm thiết bị này được nhìn thấy lần cuối hoạt động trong hệ thống.
    // Nên được cập nhật bởi logic ứng dụng khi có hoạt động từ thiết bị này.
    lastSeenAt: bigint("last_seen_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),

    // Thời điểm bản ghi thiết bị này được tạo và cập nhật lần cuối
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .default(sql`extract(epoch from now())`)
      .$onUpdate(() => sql`extract(epoch from now())`),

    // Thời điểm người dùng thu hồi/hủy quyền truy cập của thiết bị này
    revokedAt: bigint("revoked_at", { mode: "number" }).default(0),
  },
  (table) => [
    index("idx_user_devices_user_id").on(table.userId),
    // Fingerprint của thiết bị phải là duy nhất cho mỗi người dùng
    uniqueIndex("idx_user_devices_user_fingerprint").on(
      table.userId,
      table.fingerprint
    ),
    index("idx_user_devices_type").on(table.type),
    index("idx_user_devices_is_trusted").on(table.isTrusted),
    index("idx_user_devices_last_seen_at").on(table.lastSeenAt),
  ]
);

export type NewUserDevice = InferInsertModel<typeof userDevices>;
export type UserDevice = InferSelectModel<typeof userDevices>;
