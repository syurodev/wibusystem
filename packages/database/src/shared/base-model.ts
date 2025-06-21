import { getCurrentUnixTimestamp } from "@repo/utils";

/**
 * Base interface cho tất cả models với các cột cố định
 */
export interface BaseModel {
  id: string | number;
  created_at: string | number;
  updated_at: string | number;
  version?: number;
  lasted_user_modified?: bigint;
}

/**
 * Type cho việc tạo mới model (không có các field tự động)
 */
export type CreateModel<T extends BaseModel> = Omit<
  T,
  "id" | "created_at" | "updated_at" | "version"
>;

/**
 * Type cho việc update model (chỉ các field có thể update)
 */
export type UpdateModel<T extends BaseModel> = Partial<
  Omit<T, "id" | "created_at">
>;

/**
 * Utility để tạo timestamp hiện tại
 */
export const now = (): bigint => BigInt(getCurrentUnixTimestamp());

/**
 * Utility để tạo data cho insert với base fields
 */
export function withBaseFields<T>(
  data: CreateModel<T & BaseModel>,
  userId: bigint
): CreateModel<T & BaseModel> &
  Pick<BaseModel, "created_at" | "updated_at" | "lasted_user_modified"> {
  const timestamp = getCurrentUnixTimestamp();
  return {
    ...data,
    created_at: timestamp,
    updated_at: timestamp,
    lasted_user_modified: userId,
  };
}

/**
 * Utility để tạo data cho update với base fields
 */
export function withUpdateFields<T>(
  data: UpdateModel<T & BaseModel>,
  userId: bigint
): UpdateModel<T & BaseModel> &
  Pick<BaseModel, "updated_at" | "lasted_user_modified"> & { version: any } {
  return {
    ...data,
    updated_at: now(),
    lasted_user_modified: userId,
    // Increment version using SQL
    version: new SQL("version + 1"),
  };
}

// Helper class để tạo raw SQL expressions
export class SQL {
  constructor(public value: string) {}
}
