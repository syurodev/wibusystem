import { OrmError } from "./base";
import { OrmErrorCode } from "./error-codes";

/**
 * Lỗi kết nối đến database
 */
export class ConnectionError extends OrmError {
  constructor(
    message: string,
    code: OrmErrorCode = OrmErrorCode.CONNECTION_ERROR
  ) {
    super(message, code);
  }
}

/**
 * Lỗi khi thực thi truy vấn
 */
export class QueryFailedError extends OrmError {
  constructor(
    message: string,
    public query?: string,
    public parameters?: unknown[]
  ) {
    super(message, OrmErrorCode.QUERY_FAILED_ERROR);
  }
}

/**
 * Lỗi khi pool chưa được khởi tạo
 */
export class PoolNotInitializedError extends ConnectionError {
  constructor() {
    super(
      "Connection pool chưa được khởi tạo. Hãy gọi initialize() trước.",
      OrmErrorCode.POOL_NOT_INITIALIZED_ERROR
    );
  }
}
