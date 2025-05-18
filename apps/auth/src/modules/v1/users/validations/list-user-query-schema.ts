import { BOOLEAN, DEFAULT } from "@repo/common";
import { t } from "elysia";

export const ListUserQuerySchema = t.Object({
  key_search: t.Optional(t.String()),
  // Numeric sẽ tự động parse string thành number và validate
  limit: t.Optional(
    t.Numeric({
      default: DEFAULT.PAGE_LIMIT, // Giá trị mặc định
      minimum: 1, // Giá trị tối thiểu
      maximum: DEFAULT.MAX_PAGE_LIMIT, // Giá trị tối đa
      error: "Giới hạn phải là số từ 1 đến 100", // Thông báo lỗi tùy chỉnh
    })
  ),
  page: t.Optional(
    t.Numeric({
      default: DEFAULT.PAGE_NUMBER, // Giá trị mặc định
      minimum: DEFAULT.PAGE_NUMBER, // Giá trị tối thiểu
      error: "Trang phải là số từ 1 trở lên", // Thông báo lỗi tùy chỉnh
    })
  ),
  // Thay đổi is_active và is_verified thành Numeric với default -1
  is_active: t.Optional(
    t.Numeric({
      default: BOOLEAN.ALL, // Mặc định là -1 (lấy tất cả)
      error: "Trạng thái hoạt động không hợp lệ",
    })
  ),
  is_verified: t.Optional(
    t.Numeric({
      default: BOOLEAN.ALL, // Mặc định là -1 (lấy tất cả)
      error: "Trạng thái xác thực không hợp lệ",
    })
  ),
});
