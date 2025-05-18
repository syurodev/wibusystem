import { t } from "elysia";

/**
 * Schema validation cho cập nhật thông tin profile người dùng
 */
export const UpdateUserProfileSchema = t.Object(
  {
    full_name: t.Optional(
      t.String({
        minLength: 1,
        maxLength: 255,
        error: "Họ tên phải có độ dài từ 1-255 ký tự",
      })
    ),
    avatar_url: t.Optional(
      t.String({
        format: "url",
        error: "Avatar URL không hợp lệ",
      })
    ),
  },
  {
    description: "Dữ liệu cập nhật thông tin cá nhân của người dùng",
  }
);
