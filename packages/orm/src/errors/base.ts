import { OrmErrorCode } from "./error-codes";

/**
 * Lớp lỗi cơ sở cho tất cả các lỗi của ORM.
 * Mỗi lỗi sẽ có một thuộc tính `code` để dễ dàng nhận diện và xử lý.
 */
export class OrmError extends Error {
  public readonly code: OrmErrorCode;

  constructor(message: string, code: OrmErrorCode) {
    super(message);
    this.name = this.constructor.name; // Sử dụng tên của class con cho thuộc tính name
    this.code = code;

    // Đảm bảo `instanceof` hoạt động chính xác với các lớp lỗi tùy chỉnh
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
