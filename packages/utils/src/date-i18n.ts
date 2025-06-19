/**
 * Vietnamese i18n utilities for date formatting and localization
 * @packageDocumentation
 */

import dayjs from "dayjs";
import "dayjs/locale/vi"; // Import Vietnamese locale
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import weekday from "dayjs/plugin/weekday";

// Import date-utils types
import type { DateInput } from "./date-utils";

// Extend dayjs with i18n plugins
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.extend(weekday);
dayjs.extend(updateLocale);

// Vietnamese locale configuration
export const VIETNAMESE_LOCALE = "vi";
export const DEFAULT_LOCALE = "en";

/**
 * Vietnamese date/time formats
 */
export const VietnameseFormats = {
  // Standard formats
  SHORT_DATE: "DD/MM/YYYY", // 25/12/2024
  MEDIUM_DATE: "DD [tháng] MM [năm] YYYY", // 25 tháng 12 năm 2024
  LONG_DATE: "dddd, DD [tháng] MM [năm] YYYY", // Thứ Ba, 25 tháng 12 năm 2024
  FULL_DATE: "dddd, [ngày] DD [tháng] MM [năm] YYYY", // Thứ Ba, ngày 25 tháng 12 năm 2024

  // Time formats
  SHORT_TIME: "HH:mm", // 14:30
  MEDIUM_TIME: "HH:mm:ss", // 14:30:45
  LONG_TIME: "HH [giờ] mm [phút]", // 14 giờ 30 phút
  FULL_TIME: "HH [giờ] mm [phút] ss [giây]", // 14 giờ 30 phút 45 giây

  // Combined formats
  SHORT_DATETIME: "DD/MM/YYYY HH:mm", // 25/12/2024 14:30
  MEDIUM_DATETIME: "DD/MM/YYYY [lúc] HH:mm", // 25/12/2024 lúc 14:30
  LONG_DATETIME: "dddd, DD/MM/YYYY [lúc] HH:mm", // Thứ Ba, 25/12/2024 lúc 14:30
  FULL_DATETIME:
    "dddd, [ngày] DD [tháng] MM [năm] YYYY [lúc] HH [giờ] mm [phút]", // Thứ Ba, ngày 25 tháng 12 năm 2024 lúc 14 giờ 30 phút
} as const;

/**
 * Custom Vietnamese locale configuration
 */
const vietnameseLocaleConfig = {
  weekdays: [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ],
  weekdaysShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  weekdaysMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
  months: [
    "Tháng Một",
    "Tháng Hai",
    "Tháng Ba",
    "Tháng Tư",
    "Tháng Năm",
    "Tháng Sáu",
    "Tháng Bảy",
    "Tháng Tám",
    "Tháng Chín",
    "Tháng Mười",
    "Tháng Mười Một",
    "Tháng Mười Hai",
  ],
  monthsShort: [
    "Th1",
    "Th2",
    "Th3",
    "Th4",
    "Th5",
    "Th6",
    "Th7",
    "Th8",
    "Th9",
    "Th10",
    "Th11",
    "Th12",
  ],
  relativeTime: {
    future: "%s nữa",
    past: "%s trước",
    s: "vài giây",
    m: "1 phút",
    mm: "%d phút",
    h: "1 giờ",
    hh: "%d giờ",
    d: "1 ngày",
    dd: "%d ngày",
    M: "1 tháng",
    MM: "%d tháng",
    y: "1 năm",
    yy: "%d năm",
  },
};

// Initialize Vietnamese locale with custom config
dayjs.updateLocale(VIETNAMESE_LOCALE, vietnameseLocaleConfig);

// =============================================================================
// LOCALE MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Set global locale for dayjs
 * @param locale - Locale to set ('vi' for Vietnamese, 'en' for English)
 */
export function setGlobalLocale(locale: string = VIETNAMESE_LOCALE): void {
  dayjs.locale(locale);
}

/**
 * Get current global locale
 * @returns Current locale string
 */
export function getCurrentLocale(): string {
  return dayjs.locale();
}

/**
 * Execute function with temporary locale
 * @param locale - Temporary locale to use
 * @param fn - Function to execute
 * @returns Result of the function
 */
export function withLocale<T>(locale: string, fn: () => T): T {
  const currentLocale = getCurrentLocale();
  setGlobalLocale(locale);
  try {
    return fn();
  } finally {
    setGlobalLocale(currentLocale);
  }
}

// =============================================================================
// VIETNAMESE FORMATTING FUNCTIONS
// =============================================================================

/**
 * Format date in Vietnamese
 * @param date - Date input
 * @param format - Vietnamese format string
 * @param useVietnamese - Force Vietnamese locale (default: true)
 * @returns Formatted Vietnamese date string
 */
export function formatVietnamese(
  date: DateInput,
  format: string,
  useVietnamese: boolean = true
): string {
  const dayjsObj = dayjs(date);
  if (useVietnamese) {
    return dayjsObj.locale(VIETNAMESE_LOCALE).format(format);
  }
  return dayjsObj.format(format);
}

/**
 * Get Vietnamese relative time (e.g., "2 giờ trước", "3 ngày nữa")
 * @param date - Date to compare with now
 * @param withoutSuffix - Remove suffix ("trước"/"nữa")
 * @returns Vietnamese relative time string
 */
export function getVietnameseRelativeTime(
  date: DateInput,
  withoutSuffix: boolean = false
): string {
  return dayjs(date).locale(VIETNAMESE_LOCALE).fromNow(withoutSuffix);
}

/**
 * Get Vietnamese relative time between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @param withoutSuffix - Remove suffix ("trước"/"nữa")
 * @returns Vietnamese relative time string
 */
export function getVietnameseRelativeTimeBetween(
  date1: DateInput,
  date2: DateInput,
  withoutSuffix: boolean = false
): string {
  return dayjs(date1)
    .locale(VIETNAMESE_LOCALE)
    .from(dayjs(date2), withoutSuffix);
}

// =============================================================================
// VIETNAMESE DATE COMPONENTS
// =============================================================================

/**
 * Get Vietnamese weekday name
 * @param date - Date input
 * @param short - Use short format (T2, T3) instead of full (Thứ Hai, Thứ Ba)
 * @returns Vietnamese weekday name
 */
export function getVietnameseWeekday(
  date: DateInput,
  short: boolean = false
): string {
  const dayjsObj = dayjs(date).locale(VIETNAMESE_LOCALE);
  return short ? dayjsObj.format("dd") : dayjsObj.format("dddd");
}

/**
 * Get Vietnamese month name
 * @param date - Date input
 * @param short - Use short format (Th1, Th2) instead of full (Tháng Một, Tháng Hai)
 * @returns Vietnamese month name
 */
export function getVietnameseMonth(
  date: DateInput,
  short: boolean = false
): string {
  const dayjsObj = dayjs(date).locale(VIETNAMESE_LOCALE);
  return short ? dayjsObj.format("MMM") : dayjsObj.format("MMMM");
}

/**
 * Get Vietnamese date with ordinal
 * @param date - Date input
 * @returns Vietnamese date with ordinal (e.g., "ngày 25")
 */
export function getVietnameseDateOrdinal(date: DateInput): string {
  return `ngày ${dayjs(date).format("DD")}`;
}

// =============================================================================
// COMMON VIETNAMESE DATE FORMATS
// =============================================================================

/**
 * Format date as short Vietnamese date (25/12/2024)
 */
export function toVietnameseShortDate(date: DateInput): string {
  return formatVietnamese(date, VietnameseFormats.SHORT_DATE);
}

/**
 * Format date as medium Vietnamese date (25 tháng 12 năm 2024)
 */
export function toVietnameseMediumDate(date: DateInput): string {
  return formatVietnamese(date, VietnameseFormats.MEDIUM_DATE);
}

/**
 * Format date as long Vietnamese date (Thứ Ba, 25 tháng 12 năm 2024)
 */
export function toVietnameseLongDate(date: DateInput): string {
  return formatVietnamese(date, VietnameseFormats.LONG_DATE);
}

/**
 * Format date as full Vietnamese date (Thứ Ba, ngày 25 tháng 12 năm 2024)
 */
export function toVietnameseFullDate(date: DateInput): string {
  return formatVietnamese(date, VietnameseFormats.FULL_DATE);
}

/**
 * Format time as Vietnamese time (14 giờ 30 phút)
 */
export function toVietnameseTime(
  date: DateInput,
  includeSeconds: boolean = false
): string {
  const format = includeSeconds
    ? VietnameseFormats.FULL_TIME
    : VietnameseFormats.LONG_TIME;
  return formatVietnamese(date, format);
}

/**
 * Format datetime as Vietnamese datetime (Thứ Ba, 25/12/2024 lúc 14:30)
 */
export function toVietnameseDateTime(
  date: DateInput,
  long: boolean = false
): string {
  const format = long
    ? VietnameseFormats.FULL_DATETIME
    : VietnameseFormats.LONG_DATETIME;
  return formatVietnamese(date, format);
}

// =============================================================================
// VIETNAMESE TIME PERIODS
// =============================================================================

/**
 * Get Vietnamese time period (sáng, chiều, tối, đêm)
 * @param date - Date input
 * @returns Vietnamese time period
 */
export function getVietnameseTimePeriod(date: DateInput): string {
  const hour = dayjs(date).hour();

  if (hour >= 5 && hour < 12) return "sáng";
  if (hour >= 12 && hour < 18) return "chiều";
  if (hour >= 18 && hour < 22) return "tối";
  return "đêm";
}

/**
 * Format date with Vietnamese time period (sáng 25/12/2024)
 * @param date - Date input
 * @returns Date with Vietnamese time period
 */
export function toVietnameseDateWithPeriod(date: DateInput): string {
  const period = getVietnameseTimePeriod(date);
  const dateStr = toVietnameseShortDate(date);
  return `${period} ${dateStr}`;
}

/**
 * Format datetime with Vietnamese time period (sáng 25/12/2024 lúc 8:30)
 * @param date - Date input
 * @returns Datetime with Vietnamese time period
 */
export function toVietnameseDateTimeWithPeriod(date: DateInput): string {
  const period = getVietnameseTimePeriod(date);
  const dateStr = toVietnameseShortDate(date);
  const timeStr = dayjs(date).format("H:mm");
  return `${period} ${dateStr} lúc ${timeStr}`;
}

// =============================================================================
// VIETNAMESE BUSINESS/FORMAL FORMATS
// =============================================================================

/**
 * Format date for Vietnamese business/formal documents
 * @param date - Date input
 * @param includeLocation - Include "tại [location]" placeholder
 * @returns Formal Vietnamese date format
 */
export function toVietnameseFormalDate(
  date: DateInput,
  includeLocation: boolean = false
): string {
  const location = includeLocation ? ", tại ............" : "";
  const dayjs_obj = dayjs(date).locale(VIETNAMESE_LOCALE);
  const day = dayjs_obj.format("DD");
  const month = dayjs_obj.format("MM");
  const year = dayjs_obj.format("YYYY");

  return `Ngày ${day} tháng ${month} năm ${year}${location}`;
}

/**
 * Format date range in Vietnamese
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Vietnamese date range string
 */
export function toVietnameseDateRange(
  startDate: DateInput,
  endDate: DateInput
): string {
  const start = toVietnameseShortDate(startDate);
  const end = toVietnameseShortDate(endDate);
  return `từ ${start} đến ${end}`;
}

/**
 * Format date with Vietnamese lunar calendar note
 * @param date - Date input
 * @returns Date with lunar calendar note
 */
export function toVietnameseDateWithLunar(date: DateInput): string {
  const solarDate = toVietnameseShortDate(date);
  // Note: This is a placeholder - actual lunar calendar conversion would require additional library
  return `${solarDate} (âm lịch)`;
}
