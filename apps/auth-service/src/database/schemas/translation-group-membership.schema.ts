import {
  bigint,
  bigserial,
  boolean,
  index,
  integer,
  json,
  pgTable,
  smallint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Bảng liên kết giữa nhóm dịch và người dùng
 * Xác định người dùng thuộc nhóm dịch nào và có vai trò gì
 */
export const TranslationGroupMembership = pgTable(
  "translation_group_membership",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(), // ID membership, khóa chính
    translation_group_id: bigint("translation_group_id", { mode: "number" })
      .notNull()
      .default(0), // Liên kết đến bảng TranslationGroup
    user_id: bigint("user_id", { mode: "number" }).notNull().default(0), // Liên kết đến bảng User

    // Vai trò trong nhóm dịch
    role: smallint("role").notNull().default(0), // Vai trò: 0: thành viên, 1: translator, 2: editor, 3: proofreader, 4: admin, 5: owner
    specializations: json("specializations").notNull().default([]), // Chuyên môn: ["translate", "edit", "proofread", "typeset", "encode"]
    languages: json("languages").notNull().default([]), // Ngôn ngữ có thể dịch

    // Thông tin hoạt động
    join_reason: varchar("join_reason", { length: 500 }).notNull().default(""), // Lý do tham gia
    experience_level: smallint("experience_level").notNull().default(0), // Mức kinh nghiệm: 0: mới, 1: trung bình, 2: giỏi, 3: chuyên nghiệp

    // Thống kê
    completed_projects: integer("completed_projects").notNull().default(0), // Số dự án đã hoàn thành
    total_contributions: integer("total_contributions").notNull().default(0), // Tổng đóng góp
    rating: integer("rating").notNull().default(0), // Đánh giá từ nhóm (0-100)

    // Trạng thái
    status: smallint("status").notNull().default(1), // Trạng thái: 0: pending, 1: active, 2: inactive, 3: banned
    is_public: boolean("is_public").notNull().default(true), // Hiển thị công khai trong nhóm
    can_recruit: boolean("can_recruit").notNull().default(false), // Có thể tuyển thành viên mới

    // Thời gian
    joined_at: bigint("joined_at", { mode: "number" }).notNull().default(0), // Thời gian tham gia
    last_active_at: bigint("last_active_at", { mode: "number" })
      .notNull()
      .default(0), // Lần hoạt động cuối
    created_at: bigint("created_at", { mode: "number" }).notNull().default(0), // Thời gian tạo
    updated_at: bigint("updated_at", { mode: "number" }).notNull().default(0), // Thời gian cập nhật
  },
  (table) => [
    index("tg_membership_group_id_idx").on(table.translation_group_id),
    index("tg_membership_user_id_idx").on(table.user_id),
    index("tg_membership_status_idx").on(table.status),
    index("tg_membership_role_idx").on(table.role),
    uniqueIndex("tg_membership_unique_idx").on(
      table.translation_group_id,
      table.user_id
    ), // Đảm bảo người dùng chỉ thuộc một nhóm dịch một lần
  ]
);

export type TranslationGroupMembershipSelect =
  typeof TranslationGroupMembership.$inferSelect;
export type TranslationGroupMembershipInsert =
  typeof TranslationGroupMembership.$inferInsert;
