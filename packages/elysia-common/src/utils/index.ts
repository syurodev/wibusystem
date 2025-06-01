import { t, TSchema } from "elysia";

// Schema cho success response - data là optional để match ApiResponse interface
export const createSuccessResponseSchema = <T extends TSchema>(
  dataSchema: T
) => {
  return t.Object({
    success: t.Boolean(),
    message: t.String(),
    messageCode: t.String(),
    data: t.Optional(dataSchema), // ← Optional để match ApiResponse<T>
    statusCode: t.Number(),
    timestamp: t.String({ format: "date-time" }),
  });
};

// Schema cho error response (data optional/null)
export const createErrorResponseSchema = () => {
  return t.Object({
    success: t.Boolean(),
    message: t.String(),
    messageCode: t.String(),
    data: t.Optional(t.Null()), // Optional for error
    statusCode: t.Number(),
    timestamp: t.String({ format: "date-time" }),
    error: t.Optional(
      t.Object({
        code: t.Optional(t.String()),
        details: t.Optional(t.String()),
        field: t.Optional(t.String()),
      })
    ),
  });
};

// Generic schema (kept for backward compatibility)
export const createApiResponseSchema = <T extends TSchema>(
  dataSchema: T,
  isOptionalData: boolean = false
) => {
  return t.Object({
    success: t.Boolean(),
    message: t.String(),
    messageCode: t.String(),
    data: isOptionalData ? t.Optional(dataSchema) : dataSchema,
    statusCode: t.Number(),
    timestamp: t.String({ format: "date-time" }),
    error: t.Optional(
      t.Object({
        code: t.Optional(t.String()),
        details: t.Optional(t.String()),
        field: t.Optional(t.String()),
      })
    ),
  });
};

// Schema cho pagination metadata
export const paginationSchema = t.Object({
  total: t.Number(),
  page: t.Number(),
  limit: t.Number(),
  totalPages: t.Number(),
  hasNext: t.Boolean(),
  hasPrev: t.Boolean(),
});

// Schema cho paginated data
export const createPaginatedDataSchema = <T extends TSchema>(itemSchema: T) => {
  return t.Object({
    items: t.Array(itemSchema),
    pagination: paginationSchema,
  });
};

// Schema cho paginated response (full ApiResponse wrapper)
export const createPaginatedResponseSchema = <T extends TSchema>(
  itemSchema: T
) => {
  const paginatedDataSchema = createPaginatedDataSchema(itemSchema);
  return createSuccessResponseSchema(paginatedDataSchema);
};
