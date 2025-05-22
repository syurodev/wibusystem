import { Static, t } from "elysia";

export const UserLoginDto = t.Object({
  email: t.String({
    format: "email",
    example: "user@example.com",
  }),
  password: t.String({
    example: "password123",
  }),
  device_id: t.String({
    example: "unique_device_identifier_string", // Ví dụ: UUID hoặc một ID duy nhất từ client
    minLength: 1, // Đảm bảo device_id không rỗng
  }),
});

export interface UserLoginDtoType extends Static<typeof UserLoginDto> {}
