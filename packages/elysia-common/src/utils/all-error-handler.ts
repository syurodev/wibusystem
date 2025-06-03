import { Logger } from "@bogeychan/elysia-logger/dist/types";
import { createValidationErrorResponse } from "@repo/common";

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
  log: Logger | undefined
) => {
  if (log) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Request error occurred", { code, error: errorMessage });
  }

  switch (code) {
    case "VALIDATION":
      const firstError: {
        summary: string;
        type: any;
        schema: any;
        path: string;
        value: unknown;
        message: string;
        errors: any[];
      } = error.all[0] as any;

      if (firstError) {
        return createValidationErrorResponse(
          firstError.message,
          firstError.path.split("/").pop() || "",
          firstError.summary
        );
      }
  }
};
