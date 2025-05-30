import { sql } from "drizzle-orm";
import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  json,
  pgTable,
  smallint,
  text,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin nhóm dịch
 * Nhóm dịch có thể dịch anime, manga, novel
 */
export const TranslationGroup = pgTable(
  "translation_groups",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID nhóm dịch, khóa chính
    name: varchar("name", { length: 255 }).notNull().default(""), // Tên nhóm dịch
    slug: varchar("slug", { length: 255 }).notNull().default("").unique(), // URL slug của nhóm
    description: text("description").notNull().default(""), // Mô tả về nhóm dịch
    logo_url: text("logo_url").notNull().default(""), // URL logo của nhóm
    cover_url: text("cover_url").notNull().default(""), // URL ảnh bìa của nhóm
    website_url: text("website_url").notNull().default(""), // Website của nhóm
    discord_url: text("discord_url").notNull().default(""), // Discord server của nhóm

    // Thông tin hoạt động
    specialties: json("specialties").notNull().default([]), // Chuyên môn: ["anime", "manga", "novel"]
    supported_languages: json("supported_languages").notNull().default([]), // Ngôn ngữ hỗ trợ dịch
    recruitment_status: smallint("recruitment_status").notNull().default(0), // Trạng thái tuyển dụng: 0: đóng, 1: mở, 2: có điều kiện
    quality_level: smallint("quality_level").notNull().default(1), // Mức chất lượng: 1-5 sao

    // Thống kê
    total_projects: integer("total_projects").notNull().default(0), // Tổng số dự án đã hoàn thành
    total_members: integer("total_members").notNull().default(0), // Tổng số thành viên
    rating: integer("rating").notNull().default(0), // Đánh giá từ cộng đồng (0-100)

    // Trạng thái
    status: smallint("status").notNull().default(1), // Trạng thái nhóm: 0: không hoạt động, 1: hoạt động, 2: tạm dừng
    is_verified: boolean("is_verified").notNull().default(false), // Nhóm đã được xác minh
    is_recruiting: boolean("is_recruiting").notNull().default(false), // Đang tuyển thành viên

    // Thông tin liên hệ
    contact_email: varchar("contact_email", { length: 255 })
      .notNull()
      .default(""), // Email liên hệ
    contact_person_id: integer("contact_person_id").notNull().default(0), // ID người liên hệ

    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật
  },
  (table) => [
    index("translation_groups_slug_idx").on(table.slug),
    index("translation_groups_status_idx").on(table.status),
    index("translation_groups_is_recruiting_idx").on(table.is_recruiting),
    index("translation_groups_name_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.name})`
    ),
  ]
);

export type TranslationGroupSelect = typeof TranslationGroup.$inferSelect;
export type TranslationGroupInsert = typeof TranslationGroup.$inferInsert;
