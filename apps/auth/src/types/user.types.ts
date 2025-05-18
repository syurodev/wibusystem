import type { UserInsert, UserSelect } from "../database/schema/users.schema";

export enum UserRole {
  ADMIN = 0,
  USER = 1,
}

export type User = UserSelect;

export type CreateUserDto = UserInsert & {
  // Thêm các trường tùy chọn nếu UserInsert chưa có và logic của bạn cần
  // Ví dụ: role và is_active nếu chúng không được quản lý bởi account_status trong UserInsert
  // role?: UserRole; // Nếu account_status trong schema usersTable không đại diện cho role này
  // is_active?: boolean; // Nếu account_status không đại diện cho is_active
};

export type UpdateUserDto = Partial<
  Omit<UserInsert, "email"> & {
    // email thường không cho phép cập nhật hoặc có quy trình riêng
    avatar_url?: string; // Giữ lại nếu UserInsert không có avatar_url trực tiếp
    // Thêm các trường khác nếu cần
    // is_active?: boolean; // nếu account_status không bao gồm trạng thái này
  }
>;

export type UpdatePasswordDto = Pick<UserInsert, "hashed_password">;
