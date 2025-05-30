// Zod validation schemas

import { z } from "zod";
import { AUTH, PAGINATION } from "../constants/index.js";

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(
      AUTH.PASSWORD_MIN_LENGTH,
      `Mật khẩu phải có ít nhất ${AUTH.PASSWORD_MIN_LENGTH} ký tự`
    ),
});

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  username: z.string().min(3, "Username phải có ít nhất 3 ký tự"),
  password: z
    .string()
    .min(
      AUTH.PASSWORD_MIN_LENGTH,
      `Mật khẩu phải có ít nhất ${AUTH.PASSWORD_MIN_LENGTH} ký tự`
    )
    .max(
      AUTH.PASSWORD_MAX_LENGTH,
      `Mật khẩu không được quá ${AUTH.PASSWORD_MAX_LENGTH} ký tự`
    ),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token không được để trống"),
});

// Pagination schemas
export const paginationSchema = z.object({
  page: z
    .number()
    .min(1, "Trang phải lớn hơn 0")
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z
    .number()
    .min(PAGINATION.MIN_LIMIT, `Limit phải ít nhất ${PAGINATION.MIN_LIMIT}`)
    .max(PAGINATION.MAX_LIMIT, `Limit không được quá ${PAGINATION.MAX_LIMIT}`)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  filters: z.record(z.any()).optional(),
});

export const listParamsSchema = paginationSchema
  .merge(sortSchema)
  .merge(searchSchema);

// User schemas
export const userUpdateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url("Avatar phải là URL hợp lệ").optional(),
});

// ID validation schemas
export const idSchema = z.string().uuid("ID phải là UUID hợp lệ");
export const optionalIdSchema = z
  .string()
  .uuid("ID phải là UUID hợp lệ")
  .optional();

// Common field schemas
export const emailSchema = z.string().email("Email không hợp lệ");
export const passwordSchema = z
  .string()
  .min(
    AUTH.PASSWORD_MIN_LENGTH,
    `Mật khẩu phải có ít nhất ${AUTH.PASSWORD_MIN_LENGTH} ký tự`
  )
  .max(
    AUTH.PASSWORD_MAX_LENGTH,
    `Mật khẩu không được quá ${AUTH.PASSWORD_MAX_LENGTH} ký tự`
  );

// Type inference from schemas
export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenSchema>;
export type PaginationData = z.infer<typeof paginationSchema>;
export type SortData = z.infer<typeof sortSchema>;
export type SearchData = z.infer<typeof searchSchema>;
export type ListParamsData = z.infer<typeof listParamsSchema>;
export type UserUpdateData = z.infer<typeof userUpdateSchema>;
