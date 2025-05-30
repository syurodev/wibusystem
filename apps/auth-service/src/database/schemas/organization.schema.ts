import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  json,
  pgTable,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu thông tin tổ chức
 * Hỗ trợ mô hình B2B, mỗi tổ chức có thể có nhiều người dùng
 */
export const Organization = pgTable(
  "organizations",
  {
    id: serial("id").primaryKey(), // ID của tổ chức, khóa chính
    name: varchar("name", { length: 255 }).notNull().default(""), // Tên tổ chức
    slug: varchar("slug", { length: 255 }).notNull().default("").unique(), // URL slug của tổ chức, dùng trong URL
    logo_url: text("logo_url").notNull().default(""), // URL logo của tổ chức
    cover_url: text("cover_url").notNull().default(""), // URL ảnh bìa của tổ chức
    domain: varchar("domain", { length: 255 }).notNull().default(""), // Tên miền của tổ chức, dùng cho single sign-on
    metadata: json("metadata").notNull().default({}), // Dữ liệu mở rộng, lưu các thông tin bổ sung
    is_active: boolean("is_active").notNull().default(true), // Trạng thái hoạt động của tổ chức
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("organizations_slug_idx").on(table.slug), // Index cho slug để tìm kiếm nhanh
    index("organizations_domain_idx").on(table.domain), // Index cho domain để tìm kiếm nhanh
    index("organizations_name_fts_idx").using(
      "gin",
      sql`to_tsvector('simple', ${table.name})`
    ), // GIN index cho FTS không phân biệt ngôn ngữ
  ]
);

// Tạo migration riêng để thêm index gin cho full-text search trên trường name
// CREATE INDEX organizations_name_tsv_idx ON organizations USING GIN (to_tsvector('simple', name));

export type OrganizationSelect = typeof Organization.$inferSelect;
export type OrganizationInsert = typeof Organization.$inferInsert;
