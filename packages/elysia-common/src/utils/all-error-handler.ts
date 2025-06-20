import { createErrorResponse, HTTP_STATUS } from "@repo/utils";

type code =
  | number
  | "UNKNOWN"
  | "VALIDATION"
  | "NOT_FOUND"
  | "PARSE"
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_COOKIE_SIGNATURE"
  | "INVALID_FILE_TYPE";

export const allErrorHandler = (
  code: code,
  error: any,
  log: any | undefined
) => {
  if (log) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Request error occurred", { code, error: errorMessage });
  }

  console.log(code, error);

  switch (code) {
    case "VALIDATION":
      if (error.all[0]) {
        return createErrorResponse(
          error.all[0].message,
          HTTP_STATUS.BAD_REQUEST,
          {
            include_timestamp: true,
          }
        );
      }
      break;
    case "NOT_FOUND":
      return createErrorResponse(
        error.message ?? "Resource not found",
        HTTP_STATUS.NOT_FOUND
      );
    case "INTERNAL_SERVER_ERROR":
      return createErrorResponse(
        error.message ?? "Internal server error",
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    default:
      return createErrorResponse(
        error.message ?? "An error occurred",
        HTTP_STATUS.BAD_REQUEST
      );
  }
};
