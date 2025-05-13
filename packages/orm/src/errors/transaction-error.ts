import { OrmError } from "./base";
import { OrmErrorCode } from "./error-codes";

/**
 * Lỗi xảy ra trong quá trình thực thi giao dịch.
 */
export class TransactionError extends OrmError {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message, OrmErrorCode.TRANSACTION_ERROR);
    this.cause = cause;
    Object.setPrototypeOf(this, TransactionError.prototype);
    this.name = "TransactionError";
  }
}
