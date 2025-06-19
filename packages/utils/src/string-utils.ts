/**
 * String utilities with Vietnamese text processing support
 * @packageDocumentation
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default values used throughout string utilities
 */
const DEFAULT_VALUES = {
  MAX_FILENAME_LENGTH: 255,
  DEFAULT_READING_SPEED: 200, // words per minute
  MIN_PASSWORD_LENGTH: 8,
  DEFAULT_ELLIPSIS: "...",
  DEFAULT_SEPARATOR: "-",
  DEFAULT_HIGHLIGHT_TAG: "mark",
  DEFAULT_CHARSET:
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
} as const;

/**
 * Regular expressions used for validation and text processing
 */
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_CLEANUP: /[\s\-\(\)]/g,
  VIETNAMESE_PHONE_DOMESTIC: /^0[3|5|7|8|9][0-9]{8}$/,
  VIETNAMESE_PHONE_INTERNATIONAL_PLUS: /^\+84[3|5|7|8|9][0-9]{8}$/,
  VIETNAMESE_PHONE_INTERNATIONAL: /^84[3|5|7|8|9][0-9]{8}$/,
  VIETNAMESE_ID_CMND: /^[0-9]{9}$/,
  VIETNAMESE_ID_CCCD: /^[0-9]{12}$/,
  WHITESPACE_MULTIPLE: /\s+/g,
  NEWLINES_MULTIPLE: /\n\s*\n/g,
  HTML_TAGS: /<[^>]*>/g,
  NUMBERS: /\d+(\.\d+)?/g,
  VIETNAMESE_CHARS: /[^a-zA-ZÀ-ỹĐđ\s]/g,
  WORD_SPLIT: /\s+/,
  NON_ALPHANUMERIC: /[^a-z0-9\s]/g,
  NON_FILENAME_CHARS: /[^a-z0-9._-]/g,
  CASE_CONVERSION: /[-_\s]+(.)?/g,
  REGEX_SPECIAL_CHARS: /[.*+?^${}()|[\]\\]/g,
} as const;

// =============================================================================
// VIETNAMESE ACCENT REMOVAL
// =============================================================================

/**
 * Vietnamese characters mapping for accent removal
 */
const VIETNAMESE_ACCENTS_MAP: Record<string, string> = {
  // A variants
  à: "a",
  á: "a",
  ạ: "a",
  ả: "a",
  ã: "a",
  â: "a",
  ầ: "a",
  ấ: "a",
  ậ: "a",
  ẩ: "a",
  ẫ: "a",
  ă: "a",
  ằ: "a",
  ắ: "a",
  ặ: "a",
  ẳ: "a",
  ẵ: "a",
  À: "A",
  Á: "A",
  Ạ: "A",
  Ả: "A",
  Ã: "A",
  Â: "A",
  Ầ: "A",
  Ấ: "A",
  Ậ: "A",
  Ẩ: "A",
  Ẫ: "A",
  Ă: "A",
  Ằ: "A",
  Ắ: "A",
  Ặ: "A",
  Ẳ: "A",
  Ẵ: "A",

  // E variants
  è: "e",
  é: "e",
  ẹ: "e",
  ẻ: "e",
  ẽ: "e",
  ê: "e",
  ề: "e",
  ế: "e",
  ệ: "e",
  ể: "e",
  ễ: "e",
  È: "E",
  É: "E",
  Ẹ: "E",
  Ẻ: "E",
  Ẽ: "E",
  Ê: "E",
  Ề: "E",
  Ế: "E",
  Ệ: "E",
  Ể: "E",
  Ễ: "E",

  // I variants
  ì: "i",
  í: "i",
  ị: "i",
  ỉ: "i",
  ĩ: "i",
  Ì: "I",
  Í: "I",
  Ị: "I",
  Ỉ: "I",
  Ĩ: "I",

  // O variants
  ò: "o",
  ó: "o",
  ọ: "o",
  ỏ: "o",
  õ: "o",
  ô: "o",
  ồ: "o",
  ố: "o",
  ộ: "o",
  ổ: "o",
  ỗ: "o",
  ơ: "o",
  ờ: "o",
  ớ: "o",
  ợ: "o",
  ở: "o",
  ỡ: "o",
  Ò: "O",
  Ó: "O",
  Ọ: "O",
  Ỏ: "O",
  Õ: "O",
  Ô: "O",
  Ồ: "O",
  Ố: "O",
  Ộ: "O",
  Ổ: "O",
  Ỗ: "O",
  Ơ: "O",
  Ờ: "O",
  Ớ: "O",
  Ợ: "O",
  Ở: "O",
  Ỡ: "O",

  // U variants
  ù: "u",
  ú: "u",
  ụ: "u",
  ủ: "u",
  ũ: "u",
  ư: "u",
  ừ: "u",
  ứ: "u",
  ự: "u",
  ử: "u",
  ữ: "u",
  Ù: "U",
  Ú: "U",
  Ụ: "U",
  Ủ: "U",
  Ũ: "U",
  Ư: "U",
  Ừ: "U",
  Ứ: "U",
  Ự: "U",
  Ử: "U",
  Ữ: "U",

  // Y variants
  ỳ: "y",
  ý: "y",
  ỵ: "y",
  ỷ: "y",
  ỹ: "y",
  Ỳ: "Y",
  Ý: "Y",
  Ỵ: "Y",
  Ỷ: "Y",
  Ỹ: "Y",

  // D variants
  đ: "d",
  Đ: "D",
};

/**
 * Cache for Vietnamese characters (performance optimization)
 */
const VIETNAMESE_CHARS_CACHE = Object.keys(VIETNAMESE_ACCENTS_MAP);

/**
 * Vietnamese phone number patterns for validation
 */
const VIETNAMESE_PHONE_PATTERNS = [
  REGEX_PATTERNS.VIETNAMESE_PHONE_DOMESTIC,
  REGEX_PATTERNS.VIETNAMESE_PHONE_INTERNATIONAL_PLUS,
  REGEX_PATTERNS.VIETNAMESE_PHONE_INTERNATIONAL,
] as const;

/**
 * Remove Vietnamese accents from string
 * @param text - Vietnamese text to process
 * @returns Text without Vietnamese accents
 *
 * @example
 * ```typescript
 * removeVietnameseAccents("Nguyễn Văn Đức"); // "Nguyen Van Duc"
 * removeVietnameseAccents("Tiếng Việt"); // "Tieng Viet"
 * ```
 */
export function removeVietnameseAccents(text: string): string {
  if (!text) return text;

  return text
    .split("")
    .map((char) => VIETNAMESE_ACCENTS_MAP[char] ?? char)
    .join("");
}

/**
 * Check if text contains Vietnamese characters
 * @param text - Text to check
 * @returns True if text contains Vietnamese characters
 */
export function isVietnameseText(text: string): boolean {
  if (!text) return false;

  return VIETNAMESE_CHARS_CACHE.some((char) => text.includes(char));
}

// =============================================================================
// HELPER FUNCTIONS FOR TEXT PROCESSING
// =============================================================================

/**
 * Clean and normalize text for processing
 * @param text - Text to clean
 * @returns Cleaned text
 */
function cleanAndNormalizeText(text: string): string {
  return removeVietnameseAccents(text)
    .toLowerCase()
    .trim()
    .replace(REGEX_PATTERNS.WHITESPACE_MULTIPLE, " ");
}

/**
 * Remove separators from start and end of string
 * @param text - Text to clean
 * @param separator - Separator character
 * @returns Cleaned text
 */
function removeBoundingSeparators(text: string, separator: string): string {
  const escapedSeparator = separator.replace(
    REGEX_PATTERNS.REGEX_SPECIAL_CHARS,
    "\\$&"
  );
  const boundaryPattern = new RegExp(
    `^\\${escapedSeparator}+|\\${escapedSeparator}+$`,
    "g"
  );
  return text.replace(boundaryPattern, "");
}

/**
 * Replace multiple consecutive separators with single separator
 * @param text - Text to process
 * @param separator - Separator character
 * @returns Processed text
 */
function deduplicateSeparators(text: string, separator: string): string {
  const escapedSeparator = separator.replace(
    REGEX_PATTERNS.REGEX_SPECIAL_CHARS,
    "\\$&"
  );
  const duplicatePattern = new RegExp(`\\${escapedSeparator}+`, "g");
  return text.replace(duplicatePattern, separator);
}

// =============================================================================
// SLUGIFY FUNCTIONS
// =============================================================================

/**
 * Create URL-friendly slug from Vietnamese text
 * @param text - Text to slugify
 * @param separator - Separator character (default: '-')
 * @returns URL-friendly slug
 *
 * @example
 * ```typescript
 * slugify("Nguyễn Văn Đức"); // "nguyen-van-duc"
 * slugify("Tiếng Việt 123!"); // "tieng-viet-123"
 * slugify("Hello World", "_"); // "hello_world"
 * ```
 */
export function slugify(
  text: string,
  separator: string = DEFAULT_VALUES.DEFAULT_SEPARATOR
): string {
  if (!text) return "";

  const cleaned = cleanAndNormalizeText(text)
    .replace(REGEX_PATTERNS.NON_ALPHANUMERIC, "")
    .replace(REGEX_PATTERNS.WHITESPACE_MULTIPLE, separator);

  const deduplicated = deduplicateSeparators(cleaned, separator);
  return removeBoundingSeparators(deduplicated, separator);
}

/**
 * Create filename-safe string from Vietnamese text
 * @param text - Text to convert
 * @param maxLength - Maximum length (default: 255)
 * @returns Filename-safe string
 */
export function toFilename(
  text: string,
  maxLength: number = DEFAULT_VALUES.MAX_FILENAME_LENGTH
): string {
  if (!text) return "";

  const cleaned = cleanAndNormalizeText(text)
    .replace(REGEX_PATTERNS.WHITESPACE_MULTIPLE, "_")
    .replace(REGEX_PATTERNS.NON_FILENAME_CHARS, "");

  const deduplicated = deduplicateSeparators(cleaned, "_");
  const withoutBoundaries = removeBoundingSeparators(deduplicated, "_");

  return withoutBoundaries.length > maxLength
    ? withoutBoundaries.substring(0, maxLength)
    : withoutBoundaries;
}

// =============================================================================
// CASE CONVERSION FUNCTIONS
// =============================================================================

/**
 * Convert string to camelCase
 * @param text - Text to convert
 * @returns camelCase string
 */
export function toCamelCase(text: string): string {
  if (!text) return "";

  return removeVietnameseAccents(text)
    .toLowerCase()
    .replace(REGEX_PATTERNS.CASE_CONVERSION, (_, char) =>
      char ? char.toUpperCase() : ""
    );
}

/**
 * Convert string to PascalCase
 * @param text - Text to convert
 * @returns PascalCase string
 */
export function toPascalCase(text: string): string {
  const camelCase = toCamelCase(text);
  return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
}

/**
 * Convert string to snake_case
 * @param text - Text to convert
 * @returns snake_case string
 */
export function toSnakeCase(text: string): string {
  if (!text) return "";

  const cleaned = cleanAndNormalizeText(text)
    .replace(REGEX_PATTERNS.WHITESPACE_MULTIPLE, "_")
    .replace(REGEX_PATTERNS.NON_FILENAME_CHARS, "");

  const deduplicated = deduplicateSeparators(cleaned, "_");
  return removeBoundingSeparators(deduplicated, "_");
}

/**
 * Convert string to kebab-case
 * @param text - Text to convert
 * @returns kebab-case string
 */
export function toKebabCase(text: string): string {
  return slugify(text, DEFAULT_VALUES.DEFAULT_SEPARATOR);
}

// =============================================================================
// CAPITALIZATION FUNCTIONS
// =============================================================================

/**
 * Capitalize first letter of string
 * @param text - Text to capitalize
 * @returns Text with first letter capitalized
 */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Text with each word capitalized
 */
export function capitalizeWords(text: string): string {
  if (!text) return text;

  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format Vietnamese name properly (proper capitalization)
 * @param name - Vietnamese name to format
 * @returns Properly formatted Vietnamese name
 *
 * @example
 * ```typescript
 * formatVietnameseName("nguyễn văn đức"); // "Nguyễn Văn Đức"
 * formatVietnameseName("TRẦN THỊ HƯƠNG"); // "Trần Thị Hương"
 * ```
 */
export function formatVietnameseName(name: string): string {
  if (!name) return name;

  return name
    .toLowerCase()
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// =============================================================================
// STRING VALIDATION
// =============================================================================

/**
 * Validate Vietnamese email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;

  return REGEX_PATTERNS.EMAIL.test(email);
}

/**
 * Validate Vietnamese phone number
 * @param phone - Phone number to validate
 * @returns True if phone number is valid Vietnamese format
 *
 * @example
 * ```typescript
 * isValidVietnamesePhone("0912345678"); // true
 * isValidVietnamesePhone("+84912345678"); // true
 * isValidVietnamesePhone("84912345678"); // true
 * ```
 */
export function isValidVietnamesePhone(phone: string): boolean {
  if (!phone) return false;

  const cleanPhone = phone.replace(REGEX_PATTERNS.PHONE_CLEANUP, "");
  return VIETNAMESE_PHONE_PATTERNS.some((pattern) => pattern.test(cleanPhone));
}

/**
 * Validate Vietnamese ID number (CCCD/CMND)
 * @param idNumber - ID number to validate
 * @returns True if ID number is valid Vietnamese format
 */
export function isValidVietnameseId(idNumber: string): boolean {
  if (!idNumber) return false;

  const cleanId = idNumber.replace(/\s/g, "");
  return (
    REGEX_PATTERNS.VIETNAMESE_ID_CMND.test(cleanId) ||
    REGEX_PATTERNS.VIETNAMESE_ID_CCCD.test(cleanId)
  );
}

// =============================================================================
// TEXT FORMATTING
// =============================================================================

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Suffix for truncated text (default: '...')
 * @returns Truncated text
 */
export function truncate(
  text: string,
  maxLength: number,
  ellipsis: string = DEFAULT_VALUES.DEFAULT_ELLIPSIS
): string {
  if (!text || text.length <= maxLength) return text;

  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Truncate text at word boundary
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Suffix for truncated text (default: '...')
 * @returns Truncated text at word boundary
 */
export function truncateWords(
  text: string,
  maxLength: number,
  ellipsis: string = DEFAULT_VALUES.DEFAULT_ELLIPSIS
): string {
  if (!text || text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + ellipsis;
  }

  return truncated + ellipsis;
}

/**
 * Strip HTML tags from text
 * @param html - HTML string
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  if (!html) return html;

  return html.replace(REGEX_PATTERNS.HTML_TAGS, "").trim();
}

/**
 * Normalize whitespace (remove extra spaces, newlines)
 * @param text - Text to normalize
 * @returns Text with normalized whitespace
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return text;

  return text
    .replace(REGEX_PATTERNS.WHITESPACE_MULTIPLE, " ")
    .replace(REGEX_PATTERNS.NEWLINES_MULTIPLE, "\n")
    .trim();
}

/**
 * Extract numbers from text
 * @param text - Text containing numbers
 * @returns Array of numbers found in text
 */
export function extractNumbers(text: string): number[] {
  if (!text) return [];

  const matches = text.match(REGEX_PATTERNS.NUMBERS);
  return matches ? matches.map(Number) : [];
}

/**
 * Extract Vietnamese words only (remove numbers, special characters)
 * @param text - Text to process
 * @returns Vietnamese words only
 */
export function extractVietnameseWords(text: string): string {
  if (!text) return "";

  return text
    .replace(REGEX_PATTERNS.VIETNAMESE_CHARS, " ")
    .replace(REGEX_PATTERNS.WHITESPACE_MULTIPLE, " ")
    .trim();
}

// =============================================================================
// TEXT ANALYSIS
// =============================================================================

/**
 * Count words in text
 * @param text - Text to count
 * @returns Number of words
 */
export function countWords(text: string): number {
  if (!text) return 0;

  return text
    .trim()
    .split(REGEX_PATTERNS.WORD_SPLIT)
    .filter((word) => word.length > 0).length;
}

/**
 * Count characters (excluding spaces)
 * @param text - Text to count
 * @returns Number of characters
 */
export function countCharacters(text: string): number {
  if (!text) return 0;

  return text.replace(/\s/g, "").length;
}

/**
 * Get reading time estimate in minutes
 * @param text - Text to analyze
 * @param wordsPerMinute - Reading speed (default: 200 words/minute)
 * @returns Estimated reading time in minutes
 */
export function getReadingTime(
  text: string,
  wordsPerMinute: number = DEFAULT_VALUES.DEFAULT_READING_SPEED
): number {
  if (!text) return 0;

  const wordCount = countWords(text);
  return Math.ceil(wordCount / wordsPerMinute);
}

// =============================================================================
// SEARCH & HIGHLIGHT
// =============================================================================

/**
 * Escape special regex characters
 * @param text - Text to escape
 * @returns Escaped text for regex
 */
function escapeRegExp(text: string): string {
  return text.replace(REGEX_PATTERNS.REGEX_SPECIAL_CHARS, "\\$&");
}

/**
 * Highlight search terms in text (case-insensitive, accent-insensitive)
 * @param text - Text to search in
 * @param searchTerm - Term to highlight
 * @param highlightTag - HTML tag for highlighting (default: 'mark')
 * @returns Text with highlighted search terms
 */
export function highlightSearchTerm(
  text: string,
  searchTerm: string,
  highlightTag: string = DEFAULT_VALUES.DEFAULT_HIGHLIGHT_TAG
): string {
  if (!text || !searchTerm) return text;

  const normalizedText = removeVietnameseAccents(text.toLowerCase());
  const normalizedSearch = removeVietnameseAccents(searchTerm.toLowerCase());

  if (!normalizedText.includes(normalizedSearch)) return text;

  // Escape the search term to prevent regex injection
  const escapedSearchTerm = escapeRegExp(searchTerm);
  const regex = new RegExp(`(${escapedSearchTerm})`, "gi");

  // Validate tag name to prevent XSS
  const safeTag = highlightTag.replace(/[<>]/g, "");
  return text.replace(regex, `<${safeTag}>$1</${safeTag}>`);
}

/**
 * Search text with Vietnamese accent-insensitive matching
 * @param text - Text to search in
 * @param searchTerm - Term to search for
 * @returns True if search term is found (accent-insensitive)
 */
export function searchVietnameseText(
  text: string,
  searchTerm: string
): boolean {
  if (!text || !searchTerm) return false;

  const normalizedText = removeVietnameseAccents(text.toLowerCase());
  const normalizedSearch = removeVietnameseAccents(searchTerm.toLowerCase());

  return normalizedText.includes(normalizedSearch);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate random string
 * @param length - Length of random string
 * @param charset - Character set to use (default: alphanumeric)
 * @returns Random string
 */
export function generateRandomString(
  length: number,
  charset: string = DEFAULT_VALUES.DEFAULT_CHARSET
): string {
  if (length <= 0) return "";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

/**
 * Generate Vietnamese-friendly password
 * @param length - Password length (minimum 8)
 * @returns Random password without confusing characters
 */
export function generateVietnamesePassword(
  length: number = DEFAULT_VALUES.MIN_PASSWORD_LENGTH + 4
): string {
  if (length < DEFAULT_VALUES.MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Password length must be at least ${DEFAULT_VALUES.MIN_PASSWORD_LENGTH} characters`
    );
  }

  // Exclude confusing characters: 0, O, l, I, 1
  const charset =
    "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  return generateRandomString(length, charset);
}
