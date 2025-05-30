import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Bảng liên kết giữa tổ chức và người dùng
 * Xác định người dùng thuộc tổ chức nào và có vai trò gì trong tổ chức đó
 */
export const OrganizationMembership = pgTable(
  "organization_membership",
  {
    id: serial("id").primaryKey(), // ID của thành viên, khóa chính
    organization_id: integer("organization_id").notNull().default(0), // Liên kết đến bảng Organization
    user_id: integer("user_id").notNull().default(0), // Liên kết đến bảng User
    role: smallint("role").notNull().default(0), // Vai trò trong tổ chức: 0: thành viên, 1: quản trị viên, 2: chủ sở hữu
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật gần nhất, dạng unix time
  },
  (table) => [
    index("org_membership_org_id_idx").on(table.organization_id), // Index cho organization_id để tìm kiếm nhanh
    index("org_membership_user_id_idx").on(table.user_id), // Index cho user_id để tìm kiếm nhanh
    uniqueIndex("org_membership_unique_idx").on(
      table.organization_id,
      table.user_id
    ), // Đảm bảo người dùng chỉ thuộc một tổ chức một lần
  ]
);

export type OrganizationMembershipSelect =
  typeof OrganizationMembership.$inferSelect;
export type OrganizationMembershipInsert =
  typeof OrganizationMembership.$inferInsert;
