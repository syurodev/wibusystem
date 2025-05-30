import {
  bigint,
  index,
  integer,
  pgTable,
  serial,
  smallint,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng lưu lời mời tham gia tổ chức
 * Quản lý quá trình mời người dùng vào tổ chức
 */
export const OrganizationInvitation = pgTable(
  "organization_invitations",
  {
    id: serial("id").primaryKey(), // ID của lời mời, khóa chính
    organization_id: integer("organization_id").notNull().default(0), // Liên kết đến bảng Organization
    email: varchar("email", { length: 255 }).notNull().default(""), // Email của người được mời
    token: varchar("token", { length: 255 }).notNull().default("").unique(), // Token xác thực lời mời, dùng trong URL
    role: smallint("role").notNull().default(0), // Vai trò được mời: 0: thành viên, 1: quản trị viên, 2: chủ sở hữu
    expires_at: bigint("expires_at", { mode: "number" }).notNull().default(0), // Thời gian hết hạn lời mời, dạng unix time
    status: smallint("status").notNull().default(0), // Trạng thái lời mời: 0: đang chờ, 1: đã chấp nhận, 2: đã từ chối
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo, dạng unix time
  },
  (table) => [
    index("org_invitation_org_id_idx").on(table.organization_id), // Index cho organization_id để tìm kiếm nhanh
    index("org_invitation_email_idx").on(table.email), // Index cho email để tìm kiếm nhanh
    index("org_invitation_token_idx").on(table.token), // Index cho token để tìm kiếm nhanh
    index("org_invitation_status_idx").on(table.status), // Index cho status để lọc theo trạng thái
  ]
);

export type OrganizationInvitationSelect =
  typeof OrganizationInvitation.$inferSelect;
export type OrganizationInvitationInsert =
  typeof OrganizationInvitation.$inferInsert;
