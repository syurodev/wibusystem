/**
 * Number utilities for formatting, validation, and manipulation
 * @fileoverview Comprehensive number handling utilities with Vietnamese localization
 */

// Constants
const DEFAULT_VALUES = {
  DECIMAL_PLACES: 2,
  MIN_SAFE_INTEGER: Number.MIN_SAFE_INTEGER,
  MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER,
  PERCENTAGE_MULTIPLIER: 100,
  BYTES_UNITS_THRESHOLD: 1024,
} as const;

const REGEX_PATTERNS = {
  VIETNAMESE_NUMBER: /^[0-9.,\s]+$/,
  DECIMAL_NUMBER: /^\d*\.?\d+$/,
  INTEGER: /^-?\d+$/,
  SCIENTIFIC: /^-?\d+(\.\d+)?[eE][+-]?\d+$/,
} as const;

// Vietnamese number words
const VIETNAMESE_NUMBERS = {
  ONES: ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"],
  TENS: [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ],
  SPECIAL_TENS: [
    "mười",
    "mười một",
    "mười hai",
    "mười ba",
    "mười bốn",
    "mười lăm",
    "mười sáu",
    "mười bảy",
    "mười tám",
    "mười chín",
  ],
  SCALES: ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ"],
  DECIMAL: "phẩy",
  NEGATIVE: "âm",
} as const;

const BYTES_UNITS = {
  VI: ["byte", "KB", "MB", "GB", "TB", "PB"],
  EN: ["byte", "KB", "MB", "GB", "TB", "PB"],
} as const;

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  /** Number of decimal places */
  decimals?: number;
  /** Thousands separator */
  thousandsSeparator?: string;
  /** Decimal separator */
  decimalSeparator?: string;
  /** Prefix (e.g., currency symbol) */
  prefix?: string;
  /** Suffix */
  suffix?: string;
  /** Minimum digits */
  minDigits?: number;
  /** Use Vietnamese formatting */
  vietnamese?: boolean;
}

/**
 * Byte formatting options
 */
export interface ByteFormatOptions {
  /** Number of decimal places */
  decimals?: number;
  /** Use Vietnamese units */
  vietnamese?: boolean;
  /** Use binary (1024) or decimal (1000) */
  binary?: boolean;
}

/**
 * Formats a number with specified options
 */
export function formatNumber(
  value: number,
  options: NumberFormatOptions = {}
): string {
  const {
    decimals = DEFAULT_VALUES.DECIMAL_PLACES,
    thousandsSeparator = options.vietnamese ? "." : ",",
    decimalSeparator = options.vietnamese ? "," : ".",
    prefix = "",
    suffix = "",
    minDigits = 0,
  } = options;

  if (!isFinite(value)) {
    return value.toString();
  }

  // Handle negative numbers
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);

  // Format with specified decimal places
  const fixed = absoluteValue.toFixed(decimals);
  const parts = fixed.split(".");
  const integerPart = parts[0] ?? "0";
  const decimalPart = parts[1];

  // Add thousands separators
  const formattedInteger = integerPart
    .padStart(minDigits, "0")
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  // Combine parts
  let result = formattedInteger;
  if (decimals > 0 && decimalPart) {
    result += decimalSeparator + decimalPart;
  }

  // Add prefix and suffix
  result = prefix + result + suffix;

  // Add negative sign
  if (isNegative) {
    result = "-" + result;
  }

  return result;
}

/**
 * Formats a number as Vietnamese text
 */
export function numberToVietnameseText(value: number): string {
  if (!isFinite(value)) {
    return value.toString();
  }

  if (value === 0) {
    return "không";
  }

  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const parts = absoluteValue.toString().split(".");
  const integerPart = parts[0];
  const decimalPart = parts[1];

  if (!integerPart) {
    return "không";
  }

  let result = convertIntegerToVietnamese(parseInt(integerPart, 10));

  // Add decimal part
  if (decimalPart) {
    result += ` ${VIETNAMESE_NUMBERS.DECIMAL} `;
    result += decimalPart
      .split("")
      .map((digit) => VIETNAMESE_NUMBERS.ONES[parseInt(digit, 10)])
      .join(" ");
  }

  // Add negative prefix
  if (isNegative) {
    result = `${VIETNAMESE_NUMBERS.NEGATIVE} ${result}`;
  }

  return result.trim();
}

/**
 * Converts integer to Vietnamese text
 */
function convertIntegerToVietnamese(num: number): string {
  if (num === 0) return "không";
  if (num < 0)
    return `${VIETNAMESE_NUMBERS.NEGATIVE} ${convertIntegerToVietnamese(-num)}`;

  const chunks: string[] = [];
  let scaleIndex = 0;

  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkText = convertHundreds(chunk);
      const scale = VIETNAMESE_NUMBERS.SCALES[scaleIndex];
      chunks.unshift(scale ? `${chunkText} ${scale}` : chunkText);
    }
    num = Math.floor(num / 1000);
    scaleIndex++;
  }

  return chunks.join(" ");
}

/**
 * Converts hundreds to Vietnamese text
 */
function convertHundreds(num: number): string {
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  let result = "";

  if (hundreds > 0) {
    result += `${VIETNAMESE_NUMBERS.ONES[hundreds]} trăm`;
  }

  if (remainder > 0) {
    if (result) result += " ";

    if (remainder < 10) {
      result += VIETNAMESE_NUMBERS.ONES[remainder];
    } else if (remainder < 20) {
      result += VIETNAMESE_NUMBERS.SPECIAL_TENS[remainder - 10];
    } else {
      const tens = Math.floor(remainder / 10);
      const ones = remainder % 10;
      result += VIETNAMESE_NUMBERS.TENS[tens];
      if (ones > 0) {
        result += ` ${VIETNAMESE_NUMBERS.ONES[ones]}`;
      }
    }
  }

  return result;
}

/**
 * Formats bytes to human readable format
 */
export function formatBytes(
  bytes: number,
  options: ByteFormatOptions = {}
): string {
  const {
    decimals = DEFAULT_VALUES.DECIMAL_PLACES,
    vietnamese = false,
    binary = true,
  } = options;

  if (bytes === 0) return "0 byte";

  const threshold = binary ? DEFAULT_VALUES.BYTES_UNITS_THRESHOLD : 1000;
  const units = BYTES_UNITS[vietnamese ? "VI" : "EN"];

  const unitIndex = Math.floor(Math.log(Math.abs(bytes)) / Math.log(threshold));
  const adjustedUnitIndex = Math.min(unitIndex, units.length - 1);

  const value = bytes / Math.pow(threshold, adjustedUnitIndex);
  const formattedValue = formatNumber(value, { decimals, vietnamese });

  return `${formattedValue} ${units[adjustedUnitIndex]}`;
}

/**
 * Formats a number as percentage
 */
export function formatPercentage(
  value: number,
  decimals: number = DEFAULT_VALUES.DECIMAL_PLACES,
  vietnamese: boolean = false
): string {
  const percentage = value * DEFAULT_VALUES.PERCENTAGE_MULTIPLIER;
  return formatNumber(percentage, {
    decimals,
    suffix: "%",
    vietnamese,
  });
}

/**
 * Parses a formatted number string back to number
 */
export function parseFormattedNumber(
  value: string,
  vietnamese: boolean = false
): number {
  if (!value || typeof value !== "string") {
    return NaN;
  }

  let cleaned = value
    .replace(/[^\d\-.,]/g, "") // Remove everything except digits, minus, comma, dot
    .trim();

  // Handle Vietnamese formatting
  if (vietnamese) {
    // Replace Vietnamese decimal separator with dot
    const lastCommaIndex = cleaned.lastIndexOf(",");
    const lastDotIndex = cleaned.lastIndexOf(".");

    if (lastCommaIndex > lastDotIndex) {
      // Comma is decimal separator
      cleaned =
        cleaned.substring(0, lastCommaIndex).replace(/[.,]/g, "") +
        "." +
        cleaned.substring(lastCommaIndex + 1);
    } else {
      // Dot might be thousands separator
      cleaned = cleaned.replace(/\./g, "");
    }
  } else {
    // Handle English formatting
    const lastDotIndex = cleaned.lastIndexOf(".");
    const lastCommaIndex = cleaned.lastIndexOf(",");

    if (lastDotIndex > lastCommaIndex) {
      // Dot is decimal separator
      cleaned =
        cleaned.substring(0, lastDotIndex).replace(/[.,]/g, "") +
        "." +
        cleaned.substring(lastDotIndex + 1);
    } else if (lastCommaIndex > lastDotIndex) {
      // Comma is decimal separator
      cleaned =
        cleaned.substring(0, lastCommaIndex).replace(/[.,]/g, "") +
        "." +
        cleaned.substring(lastCommaIndex + 1);
    } else {
      // Remove all separators
      cleaned = cleaned.replace(/[.,]/g, "");
    }
  }

  return parseFloat(cleaned);
}

/**
 * Validates if a string is a valid number
 */
export function isValidNumber(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  return (
    REGEX_PATTERNS.DECIMAL_NUMBER.test(value.trim()) ||
    REGEX_PATTERNS.INTEGER.test(value.trim()) ||
    REGEX_PATTERNS.SCIENTIFIC.test(value.trim())
  );
}

/**
 * Validates if a string contains Vietnamese number format
 */
export function isVietnameseNumber(value: string): boolean {
  if (!value || typeof value !== "string") {
    return false;
  }

  return REGEX_PATTERNS.VIETNAMESE_NUMBER.test(value.trim());
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Rounds a number to specified decimal places
 */
export function roundTo(value: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Checks if a number is in a specific range
 */
export function isInRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true
): boolean {
  if (inclusive) {
    return value >= min && value <= max;
  }
  return value > min && value < max;
}

/**
 * Generates a random number in range
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Generates a random integer in range
 */
export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/**
 * Checks if a number is safe integer
 */
export function isSafeInteger(value: number): boolean {
  return (
    Number.isSafeInteger(value) &&
    value >= DEFAULT_VALUES.MIN_SAFE_INTEGER &&
    value <= DEFAULT_VALUES.MAX_SAFE_INTEGER
  );
}

/**
 * Calculates the sum of an array of numbers
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((acc, num) => acc + num, 0);
}

/**
 * Calculates the average of an array of numbers
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return sum(numbers) / numbers.length;
}

/**
 * Finds the minimum value in an array
 */
export function min(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error("Cannot find minimum of empty array");
  }
  return Math.min(...numbers);
}

/**
 * Finds the maximum value in an array
 */
export function max(numbers: number[]): number {
  if (numbers.length === 0) {
    throw new Error("Cannot find maximum of empty array");
  }
  return Math.max(...numbers);
}

/**
 * Calculates the median of an array of numbers
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0;

  const sorted = [...numbers].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    const prev = sorted[middle - 1];
    const curr = sorted[middle];
    if (prev !== undefined && curr !== undefined) {
      return (prev + curr) / 2;
    }
    return 0;
  }

  const middleValue = sorted[middle];
  return middleValue ?? 0;
}
