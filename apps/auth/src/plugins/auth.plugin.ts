import { Elysia } from "elysia";

/**
 * Plugin xử lý thông tin xác thực từ Gateway
 *
 * Gateway sẽ xác thực token và truyền thông tin user xuống qua header.
 * Plugin này chỉ đơn giản lấy thông tin đó từ header.
 * Nếu không có thông tin user, cung cấp giá trị mặc định.
 */
export const authPlugin = new Elysia().derive(
  { as: "global" },
  ({ headers }) => {
    // Header 'X-User-Id' và các header khác sẽ được Gateway đặt sau khi xác thực token
    const userId = headers["x-user-id"];
    const userEmail = headers["x-user-email"];

    // Luôn trả về đối tượng user, nếu không có userId hoặc userEmail thì cung cấp giá trị mặc định
    return {
      user: {
        id: userId ? BigInt(userId) : BigInt(0),
        email: userEmail ?? "",
      },
    };
  }
);
