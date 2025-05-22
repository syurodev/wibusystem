// File: apps/auth/src/utils/error-formatter.util.ts
import { createErrorResponse, HttpStatusCode, MessageCode } from "@repo/common";
import type { Context, ValidationError } from "elysia"; // Cần các type này
import { CustomError } from "src/common/errors/custom.error";

// Định nghĩa ErrorDetail (nếu chưa có ở @repo/common)
interface ErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

const mapElysiaCodeToMessageCode = (
  elysiaCode: string
): MessageCode | undefined => {
  const upperCaseCode = elysiaCode.toUpperCase();
  switch (upperCaseCode) {
    case "VALIDATION":
      return (
        (MessageCode as any)["VALIDATION_ERROR"] ??
        (MessageCode as any)["INVALID_INPUT"]
      );
    case "NOT_FOUND":
      return (MessageCode as any)["NOT_FOUND"];
    case "INTERNAL_SERVER_ERROR":
      return (MessageCode as any)["INTERNAL_SERVER_ERROR"];
    case "UNAUTHORIZED":
      return (MessageCode as any)["UNAUTHORIZED"];
    default:
      return (
        (MessageCode as any)["UNKNOWN_ERROR"] ??
        (MessageCode as any).INTERNAL_SERVER_ERROR
      ); // Fallback an toàn hơn
  }
};

// Kiểu cho tham số context của onError
type ErrorHandlerContext = {
  code: string | number; // Cho phép cả string (e.g., 'VALIDATION') và number (e.g., HTTP status codes)
  error: Error | ValidationError | any;
  set: Context["set"];
  request: Context["request"];
};

export function handleAppError(context: ErrorHandlerContext) {
  const { code, error, set, request } = context;

  // Đảm bảo 'code' được xử lý như một chuỗi cho logic bên dưới
  const stringCode = String(code);

  let responseMessage: string = "Đã xảy ra lỗi không mong muốn.";
  let responseStatusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  let responseMessageCode: MessageCode =
    mapElysiaCodeToMessageCode(stringCode) ??
    (MessageCode as any).INTERNAL_SERVER_ERROR;
  let responseErrorDetails: ErrorDetail[] | undefined = undefined;

  if (error instanceof CustomError) {
    responseStatusCode = error.statusCode;
    responseMessageCode = error.messageCode;
    responseMessage = error.message;
    responseErrorDetails = [{ field: "email", message: error.message }]; // Hoặc trường cụ thể nếu có
  } else if (error instanceof CustomError) {
    // Xử lý AuthenticationError
    responseStatusCode = error.statusCode;
    responseMessageCode = error.messageCode;
    responseMessage = error.message;
    // Có thể thêm errorDetails nếu cần, ví dụ field nào gây lỗi
  } else if (stringCode === "VALIDATION") {
    const validationError = error as ValidationError;
    responseStatusCode = HttpStatusCode.BAD_REQUEST;
    responseMessageCode =
      mapElysiaCodeToMessageCode(stringCode) ?? responseMessageCode;

    responseErrorDetails = validationError.all.map((err: any) => {
      responseMessage =
        err.message ??
        "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại các trường thông tin.";
      return {
        field: err.path?.substring(1) ?? "unknown_field", // Bỏ dấu '/' ở đầu
        message: err.message ?? "Unknown validation error",
      };
    });
  } else if (
    typeof code === "string" &&
    stringCode !== "UNKNOWN" &&
    "status" in error &&
    typeof (error as any).status === "number" &&
    "message" in error
  ) {
    const typedError = error as { status: number; message: string };
    responseStatusCode = typedError.status as HttpStatusCode;
    responseMessage = typedError.message;
    responseMessageCode =
      mapElysiaCodeToMessageCode(stringCode) ?? responseMessageCode;
  } else if (error instanceof Error) {
    responseMessage = error.message;
    const customStatus = (error as any).status || (error as any).statusCode;
    if (
      typeof customStatus === "number" &&
      customStatus >= 100 &&
      customStatus < 600
    ) {
      responseStatusCode = customStatus as HttpStatusCode;
    }
    // Sử dụng stringCode nếu error.name không cung cấp thông tin hữu ích cho việc map message code
    responseMessageCode =
      mapElysiaCodeToMessageCode(error.name) ??
      mapElysiaCodeToMessageCode(stringCode) ??
      responseMessageCode;
    responseErrorDetails = [
      {
        field: error.name || "general",
        message: error.message,
      },
    ];
  } else {
    responseMessageCode =
      mapElysiaCodeToMessageCode(stringCode) ??
      (MessageCode as any).INTERNAL_SERVER_ERROR;
    responseErrorDetails = [{ field: "unknown", message: String(error) }];
  }

  set.status = responseStatusCode;

  return createErrorResponse(
    responseMessage,
    responseStatusCode,
    responseMessageCode,
    responseErrorDetails
  );
}
