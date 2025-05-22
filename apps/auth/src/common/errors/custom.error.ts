import { HttpStatusCode, MessageCode } from "@repo/common";

export class CustomError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly messageCode: MessageCode;

  constructor(
    message: string,
    statusCode: HttpStatusCode = HttpStatusCode.UNAUTHORIZED, // Mặc định là Unauthorized
    messageCode: MessageCode = MessageCode.AUTHENTICATION_FAILED // Một mã chung nếu không có mã cụ thể
  ) {
    super(message);
    this.name = "CustomError";
    this.statusCode = statusCode;
    this.messageCode = messageCode;
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
