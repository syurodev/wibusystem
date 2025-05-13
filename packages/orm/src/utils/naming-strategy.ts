/**
 * Chuyển đổi một chuỗi từ camelCase hoặc PascalCase sang snake_case
 * @param input Chuỗi đầu vào
 */
export function toSnakeCase(input: string): string {
  return input
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z])(?=[a-z])/g, "$1_$2")
    .toLowerCase();
}

/**
 * Chuyển đổi một chuỗi sang dạng số nhiều
 * Lưu ý: Đây là một cách đơn giản, không xử lý tất cả các trường hợp đặc biệt
 * @param input Chuỗi đầu vào
 */
export function toPlural(input: string): string {
  // Xử lý một số trường hợp đặc biệt
  if (input.endsWith("y") && !isVowel(input.charAt(input.length - 2))) {
    return input.slice(0, -1) + "ies";
  }
  if (
    input.endsWith("s") ||
    input.endsWith("x") ||
    input.endsWith("z") ||
    input.endsWith("ch") ||
    input.endsWith("sh")
  ) {
    return input + "es";
  }

  // Trường hợp mặc định
  return input + "s";
}

/**
 * Chuyển đổi một chuỗi từ camelCase hoặc PascalCase sang snake_case và số nhiều
 * @param input Chuỗi đầu vào
 */
export function toPluralSnakeCase(input: string): string {
  return toPlural(toSnakeCase(input));
}

/**
 * Kiểm tra xem một ký tự có phải là nguyên âm không
 * @param char Ký tự cần kiểm tra
 */
function isVowel(char: string): boolean {
  return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
}

/**
 * Chuyển đổi một chuỗi từ snake_case sang camelCase
 * @param input Chuỗi đầu vào (snake_case)
 */
export function toCamelCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/_([a-z0-9])/g, (_match, char) => char.toUpperCase());
}
