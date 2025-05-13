/**
 * Định nghĩa các loại điều kiện WHERE khác nhau.
 */

// Điều kiện đơn giản: field = value, field > value, etc.
// Sẽ được tạo tự động từ các phương thức như where('age > $1', [30])
export interface SimpleWhereCondition {
  type: "simple";
  condition: string; // Ví dụ: "user.status = $1" hoặc "posts.createdAt > $2"
  parameters: unknown[];
  operator: "AND" | "OR";
}

// Điều kiện BETWEEN: field BETWEEN start AND end
export interface BetweenWhereCondition {
  type: "between";
  field: string; // Tên thuộc tính hoặc cột
  startValue: unknown;
  endValue: unknown;
  operator: "AND" | "OR";
}

// Điều kiện LIKE/ILIKE: field LIKE/ILIKE pattern
export interface LikeWhereCondition {
  type: "like" | "ilike"; // Phân biệt LIKE và ILIKE
  field: string;
  pattern: string; // Ví dụ: '%john%'
  operator: "AND" | "OR";
}

// Điều kiện IN: field IN (value1, value2, ...)
export interface InWhereCondition {
  type: "in";
  field: string;
  values: unknown[];
  operator: "AND" | "OR";
}

// Điều kiện IS NULL / IS NOT NULL
export interface NullWhereCondition {
  type: "null" | "notNull";
  field: string;
  operator: "AND" | "OR";
}

// Union type cho tất cả các loại điều kiện WHERE
export type WhereClauseCondition =
  | SimpleWhereCondition
  | BetweenWhereCondition
  | LikeWhereCondition
  | InWhereCondition
  | NullWhereCondition;

/**
 * Interface định nghĩa cấu trúc cho một mệnh đề ORDER BY
 */
export interface OrderByClause {
  field: string; // Tên thuộc tính hoặc tên cột
  direction: "ASC" | "DESC";
}

/**
 * Cấu trúc nội bộ để lưu trữ một mệnh đề SELECT đã được phân tích.
 */
export interface InternalSelectClause {
  propertyToMap?: string; // Tên thuộc tính của entity cần map sang tên cột
  rawExpression?: string; // Biểu thức SQL thô
  outputAlias?: string; // Alias cho cột trong kết quả (ví dụ: 'userName')
}

/**
 * Kiểu dữ liệu đầu vào cho phương thức select().
 */
export type SelectInputItem =
  | string // 'userName', 'COUNT(*) as total'
  | { property: string; alias?: string } // { property: 'registrationDate', alias: 'regDate' }
  | { expression: string; alias: string }; // { expression: 'LOWER(email)', alias: 'lowerEmail' }

/**
 * Kiểu dữ liệu cho giá trị truyền vào khi INSERT.
 * Có thể là một object cho một hàng, hoặc một mảng các object cho nhiều hàng.
 * Keys là tên thuộc tính của entity, values là giá trị tương ứng.
 */
export type InsertInput = Record<string, unknown> | Record<string, unknown>[];

/**
 * Kiểu dữ liệu cho giá trị truyền vào khi UPDATE (mệnh đề SET).
 * Keys là tên thuộc tính của entity, values là giá trị mới.
 */
export type UpdateInput = Record<string, unknown>;

/**
 * Các cột để trả về sau khi INSERT, UPDATE, hoặc DELETE.
 * Có thể là một tên cột, một mảng tên cột, hoặc '*' để trả về tất cả các cột.
 */
export type ReturningColumn = string;
export type ReturningColumns = ReturningColumn[];
export type ReturningOption = ReturningColumn | ReturningColumns | "*";
