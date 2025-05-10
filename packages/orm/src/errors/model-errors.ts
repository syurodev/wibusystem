import { OrmError } from "./base";
import { OrmErrorCode } from "./error-codes";

/**
 * Lỗi liên quan đến model
 */
export class ModelError extends OrmError {
  constructor(message: string, code: OrmErrorCode = OrmErrorCode.MODEL_ERROR) {
    super(message, code);
  }
}

/**
 * Lỗi khi model chưa được đăng ký
 */
export class ModelNotRegisteredError extends ModelError {
  constructor(className: string) {
    super(
      `Model '${className}' chưa được đăng ký.`,
      OrmErrorCode.MODEL_NOT_REGISTERED_ERROR
    );
  }
}

/**
 * Lỗi khi không tìm thấy thuộc tính trong model
 */
export class PropertyNotFoundError extends ModelError {
  constructor(className: string, propertyName: string) {
    super(
      `Thuộc tính '${propertyName}' không tồn tại trong model '${className}'.`,
      OrmErrorCode.MODEL_PROPERTY_NOT_FOUND_ERROR
    );
  }
}

/**
 * Lỗi khi chuyển đổi giá trị của model
 */
export class ValueConversionError extends ModelError {
  constructor(message: string) {
    super(message, OrmErrorCode.MODEL_VALUE_CONVERSION_ERROR);
  }
}
