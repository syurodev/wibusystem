import {
  bigint,
  bigserial,
  boolean,
  index,
  json,
  pgTable,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin profile mở rộng của người dùng
 * Chứa thông tin liên quan đến việc xem anime, đọc manga/novel
 */
export const UserProfile = pgTable(
  "user_profiles",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID profile, khóa chính
    user_id: bigint("user_id", { mode: "number" }).notNull().unique(), // Liên kết đến bảng User (1-1)

    // Thông tin ngôn ngữ và preferences
    preferred_language: varchar("preferred_language", { length: 10 })
      .notNull()
      .default("vi"), // Ngôn ngữ ưa thích
    timezone: varchar("timezone", { length: 50 })
      .notNull()
      .default("Asia/Ho_Chi_Minh"), // Múi giờ

    // Thông tin cho hệ thống anime/manga/novel
    favorite_genres: json("favorite_genres").notNull().default([]), // Thể loại yêu thích
    reading_preferences: json("reading_preferences").notNull().default({}), // Cài đặt đọc (font size, theme, etc.)
    viewing_preferences: json("viewing_preferences").notNull().default({}), // Cài đặt xem (quality, subtitle, etc.)

    // Thông tin thống kê
    total_reading_time: bigint("total_reading_time", { mode: "number" })
      .notNull()
      .default(0), // Tổng thời gian đọc (phút)
    total_watching_time: bigint("total_watching_time", { mode: "number" })
      .notNull()
      .default(0), // Tổng thời gian xem (phút)

    // Cài đặt privacy
    is_profile_public: boolean("is_profile_public").notNull().default(true), // Profile công khai
    is_reading_list_public: boolean("is_reading_list_public")
      .notNull()
      .default(true), // Danh sách đọc công khai
    is_watching_list_public: boolean("is_watching_list_public")
      .notNull()
      .default(true), // Danh sách xem công khai

    // Thông tin cho nhóm dịch
    translation_languages: json("translation_languages").notNull().default([]), // Ngôn ngữ có thể dịch
    translation_experience: smallint("translation_experience")
      .notNull()
      .default(0), // Kinh nghiệm dịch: 0: mới, 1: trung bình, 2: giỏi, 3: chuyên nghiệp

    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật
  },
  (table) => [
    index("user_profiles_user_id_idx").on(table.user_id),
    index("user_profiles_preferred_language_idx").on(table.preferred_language),
  ]
);

export type UserProfileSelect = typeof UserProfile.$inferSelect;
export type UserProfileInsert = typeof UserProfile.$inferInsert;
