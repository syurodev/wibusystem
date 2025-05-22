import { Static, t } from "elysia";

export const UserRegisterDto = t.Object({
  email: t.String({
    format: "email",
    example: "user@example.com",
  }),
  password: t.String({
    example: "password123",
  }),
  display_name: t.String({
    example: "User Name",
  }),
});

export interface UserRegisterDtoType extends Static<typeof UserRegisterDto> {}
