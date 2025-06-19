/**
 * Currency utilities for formatting and conversion
 * @fileoverview Comprehensive currency handling utilities with Vietnamese dong support
 */

import type { NumberFormatOptions } from "./number-utils";
import { formatNumber, numberToVietnameseText } from "./number-utils";

// Constants
const DEFAULT_VALUES = {
  VND_DECIMALS: 0,
  USD_DECIMALS: 2,
  DEFAULT_EXCHANGE_RATE: 24000, // VND per USD (approximate)
  MIN_CURRENCY_VALUE: 0,
  MAX_SAFE_CURRENCY: 999999999999, // 999 billion
} as const;

const CURRENCY_SYMBOLS = {
  VND: "₫",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  GBP: "£",
  CNY: "¥",
  KRW: "₩",
} as const;

const CURRENCY_NAMES = {
  VI: {
    VND: "đồng",
    USD: "đô la Mỹ",
    EUR: "euro",
    JPY: "yên Nhật",
    GBP: "bảng Anh",
    CNY: "nhân dân tệ",
    KRW: "won Hàn Quốc",
  },
  EN: {
    VND: "Vietnamese dong",
    USD: "US dollar",
    EUR: "Euro",
    JPY: "Japanese yen",
    GBP: "British pound",
    CNY: "Chinese yuan",
    KRW: "South Korean won",
  },
} as const;

// Vietnamese currency reading parts
const VND_READING_PARTS = {
  CURRENCY_UNIT: "đồng",
  LARGE_NUMBERS: {
    1000: "nghìn",
    1000000: "triệu",
    1000000000: "tỷ",
    1000000000000: "nghìn tỷ",
  },
  COMMON_AMOUNTS: {
    1000: "một nghìn",
    5000: "năm nghìn",
    10000: "mười nghìn",
    20000: "hai mười nghìn",
    50000: "năm mười nghìn",
    100000: "một trăm nghìn",
    200000: "hai trăm nghìn",
    500000: "năm trăm nghìn",
  },
} as const;

/**
 * Currency formatting options
 */
export interface CurrencyFormatOptions extends NumberFormatOptions {
  /** Currency code (e.g., 'VND', 'USD') */
  currency?: string;
  /** Show currency symbol */
  showSymbol?: boolean;
  /** Show currency name */
  showName?: boolean;
  /** Position of currency symbol/name */
  position?: "before" | "after";
  /** Use compact format (e.g., 1.5M instead of 1,500,000) */
  compact?: boolean;
  /** Language for currency names */
  locale?: "vi" | "en";
}

/**
 * Exchange rate data
 */
export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  lastUpdated?: Date;
}

/**
 * Price range
 */
export interface PriceRange {
  min: number;
  max: number;
  currency: string;
}

/**
 * Formats a currency amount
 */
export function formatCurrency(
  amount: number,
  options: CurrencyFormatOptions = {}
): string {
  const {
    currency = "VND",
    showSymbol = true,
    showName = false,
    position = "after",
    compact = false,
    locale = "vi",
    vietnamese = locale === "vi",
    decimals = currency === "VND"
      ? DEFAULT_VALUES.VND_DECIMALS
      : DEFAULT_VALUES.USD_DECIMALS,
    ...formatOptions
  } = options;

  if (!isFinite(amount)) {
    return amount.toString();
  }

  // Handle compact format
  if (compact) {
    return formatCompactCurrency(amount, currency, locale, vietnamese);
  }

  // Format the number
  const formattedAmount = formatNumber(amount, {
    decimals,
    vietnamese,
    ...formatOptions,
  });

  // Get currency symbol and name
  const symbol =
    CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
  const currencyNames =
    CURRENCY_NAMES[locale.toUpperCase() as keyof typeof CURRENCY_NAMES];
  const name =
    currencyNames?.[currency as keyof typeof currencyNames] || currency;

  // Build the result
  let result = formattedAmount;

  if (showSymbol || showName) {
    const currencyPart = showName ? name : symbol;

    if (position === "before") {
      result = `${currencyPart} ${result}`;
    } else {
      result = `${result} ${currencyPart}`;
    }
  }

  return result;
}

/**
 * Formats currency in compact format
 */
function formatCompactCurrency(
  amount: number,
  currency: string,
  locale: string,
  vietnamese: boolean
): string {
  const absAmount = Math.abs(amount);
  const isNegative = amount < 0;

  let value = absAmount;
  let unit = "";

  if (vietnamese) {
    if (absAmount >= 1000000000) {
      value = absAmount / 1000000000;
      unit = "tỷ";
    } else if (absAmount >= 1000000) {
      value = absAmount / 1000000;
      unit = "tr";
    } else if (absAmount >= 1000) {
      value = absAmount / 1000;
      unit = "k";
    }
  } else {
    if (absAmount >= 1000000000) {
      value = absAmount / 1000000000;
      unit = "B";
    } else if (absAmount >= 1000000) {
      value = absAmount / 1000000;
      unit = "M";
    } else if (absAmount >= 1000) {
      value = absAmount / 1000;
      unit = "K";
    }
  }

  const decimals = value >= 10 ? 0 : 1;
  const formattedValue = formatNumber(value, { decimals, vietnamese });
  const symbol =
    CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;

  let result = unit ? `${formattedValue}${unit}` : formattedValue;
  if (isNegative) {
    result = `-${result}`;
  }

  return `${result} ${symbol}`;
}

/**
 * Formats VND specifically with Vietnamese reading
 */
export function formatVND(
  amount: number,
  options: Omit<CurrencyFormatOptions, "currency"> = {}
): string {
  return formatCurrency(amount, {
    currency: "VND",
    vietnamese: true,
    locale: "vi",
    ...options,
  });
}

/**
 * Converts VND amount to Vietnamese text reading
 */
export function vndToVietnameseText(amount: number): string {
  if (!isFinite(amount)) {
    return amount.toString();
  }

  if (amount === 0) {
    return `không ${VND_READING_PARTS.CURRENCY_UNIT}`;
  }

  // Check for common amounts
  const commonAmount =
    VND_READING_PARTS.COMMON_AMOUNTS[
      amount as keyof typeof VND_READING_PARTS.COMMON_AMOUNTS
    ];
  if (commonAmount) {
    return `${commonAmount} ${VND_READING_PARTS.CURRENCY_UNIT}`;
  }

  // Convert number to Vietnamese text
  const numberText = numberToVietnameseText(amount);
  return `${numberText} ${VND_READING_PARTS.CURRENCY_UNIT}`;
}

/**
 * Parses a currency string back to number
 */
export function parseCurrency(value: string, currency: string = "VND"): number {
  if (!value || typeof value !== "string") {
    return NaN;
  }

  // Remove currency symbols and names
  const symbol =
    CURRENCY_SYMBOLS[currency as keyof typeof CURRENCY_SYMBOLS] || currency;
  const viNames = CURRENCY_NAMES.VI[currency as keyof typeof CURRENCY_NAMES.VI];
  const enNames = CURRENCY_NAMES.EN[currency as keyof typeof CURRENCY_NAMES.EN];

  let cleaned = value.toLowerCase();

  // Remove currency indicators
  cleaned = cleaned
    .replace(new RegExp(symbol.toLowerCase(), "g"), "")
    .replace(new RegExp(viNames?.toLowerCase() || "", "g"), "")
    .replace(new RegExp(enNames?.toLowerCase() || "", "g"), "")
    .replace(/[^\d\-.,kmgtb]/gi, "")
    .trim();

  // Handle compact notation
  const compactMultipliers: Record<string, number> = {
    k: 1000,
    tr: 1000000,
    m: 1000000,
    tỷ: 1000000000,
    b: 1000000000,
    g: 1000000000,
    t: 1000000000000,
  };

  let multiplier = 1;
  for (const [unit, mult] of Object.entries(compactMultipliers)) {
    if (cleaned.includes(unit)) {
      multiplier = mult;
      cleaned = cleaned.replace(unit, "");
      break;
    }
  }

  // Parse the numeric part
  const isVietnamese = currency === "VND";
  const numberPart = parseFloat(
    cleaned.replace(/[.,]/g, (match) => {
      // Handle Vietnamese decimal separator
      if (isVietnamese) {
        return cleaned.lastIndexOf(match) === cleaned.indexOf(match) ? "." : "";
      }
      return match === "." ? "." : "";
    })
  );

  return isNaN(numberPart) ? NaN : numberPart * multiplier;
}

/**
 * Converts currency amounts
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  exchangeRate: number
): number {
  if (!isFinite(amount) || !isFinite(exchangeRate)) {
    return NaN;
  }

  if (fromCurrency === toCurrency) {
    return amount;
  }

  return amount * exchangeRate;
}

/**
 * Formats a price range
 */
export function formatPriceRange(
  range: PriceRange,
  options: CurrencyFormatOptions = {}
): string {
  const { min, max, currency } = range;

  if (min === max) {
    return formatCurrency(min, { currency, ...options });
  }

  const minFormatted = formatCurrency(min, { currency, ...options });
  const maxFormatted = formatCurrency(max, { currency, ...options });

  const separator = options.locale === "vi" ? " - " : " - ";
  return `${minFormatted}${separator}${maxFormatted}`;
}

/**
 * Calculates percentage change in price
 */
export function calculatePriceChange(
  oldPrice: number,
  newPrice: number
): { change: number; percentage: number; direction: "up" | "down" | "same" } {
  if (!isFinite(oldPrice) || !isFinite(newPrice) || oldPrice === 0) {
    return { change: 0, percentage: 0, direction: "same" };
  }

  const change = newPrice - oldPrice;
  const percentage = (change / oldPrice) * 100;

  const direction = change > 0 ? "up" : change < 0 ? "down" : "same";

  return { change, percentage, direction };
}

/**
 * Validates currency amount
 */
export function isValidCurrencyAmount(
  amount: number,
  currency: string = "VND"
): boolean {
  if (!isFinite(amount)) {
    return false;
  }

  return (
    amount >= DEFAULT_VALUES.MIN_CURRENCY_VALUE &&
    amount <= DEFAULT_VALUES.MAX_SAFE_CURRENCY
  );
}

/**
 * Formats currency for different contexts
 */
export function formatCurrencyForContext(
  amount: number,
  context: "display" | "input" | "export" | "compact",
  currency: string = "VND",
  locale: "vi" | "en" = "vi"
): string {
  const baseOptions: CurrencyFormatOptions = {
    currency,
    vietnamese: locale === "vi",
    locale,
  };

  switch (context) {
    case "display":
      return formatCurrency(amount, {
        ...baseOptions,
        showSymbol: true,
        position: "after",
      });

    case "input":
      return formatCurrency(amount, {
        ...baseOptions,
        showSymbol: false,
        showName: false,
      });

    case "export":
      return formatCurrency(amount, {
        ...baseOptions,
        showSymbol: false,
        showName: true,
        vietnamese: false,
        thousandsSeparator: ",",
        decimalSeparator: ".",
      });

    case "compact":
      return formatCurrency(amount, {
        ...baseOptions,
        compact: true,
        showSymbol: true,
      });

    default:
      return formatCurrency(amount, baseOptions);
  }
}

/**
 * Creates exchange rate calculator
 */
export function createExchangeRateCalculator(
  rates: ExchangeRate[]
): (amount: number, from: string, to: string) => number | null {
  const rateMap = new Map<string, number>();

  // Build rate map
  rates.forEach((rate) => {
    const key = `${rate.from}-${rate.to}`;
    rateMap.set(key, rate.rate);

    // Add reverse rate
    const reverseKey = `${rate.to}-${rate.from}`;
    rateMap.set(reverseKey, 1 / rate.rate);
  });

  return (amount: number, from: string, to: string): number | null => {
    if (from === to) return amount;

    const key = `${from}-${to}`;
    const rate = rateMap.get(key);

    if (rate === undefined) return null;

    return convertCurrency(amount, from, to, rate);
  };
}
