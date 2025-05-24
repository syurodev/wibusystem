import { Static, t } from "elysia";

/**
 * DTO cho yêu cầu đăng xuất
 * Không cần body vì sẽ sử dụng token từ header để xác định phiên đăng nhập cần hủy
 */
export const LogoutDto = t.Object({
  all_devices: t.Optional(t.Boolean({
    description: 'Đăng xuất khỏi tất cả các thiết bị',
    default: false
  })),
});

export interface LogoutDtoType extends Static<typeof LogoutDto> {}
