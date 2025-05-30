import {
  bigint,
  bigserial,
  index,
  pgTable,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin follow giữa các người dùng
 * Hỗ trợ tính năng social networking
 */
export const UserFollow = pgTable(
  "user_follows",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID follow, khóa chính
    follower_id: bigint("follower_id", { mode: "number" }).notNull().default(0), // ID người follow
    following_id: bigint("following_id", { mode: "number" })
      .notNull()
      .default(0), // ID người được follow

    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian follow
  },
  (table) => [
    index("user_follows_follower_idx").on(table.follower_id),
    index("user_follows_following_idx").on(table.following_id),
    uniqueIndex("user_follows_unique_idx").on(
      table.follower_id,
      table.following_id
    ), // Đảm bảo không follow trùng lặp
  ]
);

export type UserFollowSelect = typeof UserFollow.$inferSelect;
export type UserFollowInsert = typeof UserFollow.$inferInsert;
