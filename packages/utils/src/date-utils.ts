/**
 * Date utilities using Day.js for timezone handling, arithmetic operations, and comparisons
 * @packageDocumentation
 */

import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isBetweenPlugin from "dayjs/plugin/isBetween";
import isLeapYear from "dayjs/plugin/isLeapYear";
import isSameOrAfterPlugin from "dayjs/plugin/isSameOrAfter";
import isSameOrBeforePlugin from "dayjs/plugin/isSameOrBefore";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

// Extend dayjs with required plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBeforePlugin);
dayjs.extend(isSameOrAfterPlugin);
dayjs.extend(isBetweenPlugin);
dayjs.extend(relativeTime);
dayjs.extend(isLeapYear);

// Constants
export const VIETNAM_TIMEZONE = "Asia/Ho_Chi_Minh"; // GMT+7
export const UTC_TIMEZONE = "UTC"; // GMT+0

/**
 * Supported date formats
 */
export const DateFormats = {
  DD_MM_YYYY: "DD/MM/YYYY",
  DD_MM_YYYY_HH_MM: "DD/MM/YYYY HH:mm",
  DD_MM_YYYY_HH_MM_SS: "DD/MM/YYYY HH:mm:ss",
  DD_MM_YYYY_DASH: "DD-MM-YYYY",
  DD_MM_YYYY_HH_MM_DASH: "DD-MM-YYYY HH:mm",
  DD_MM_YYYY_HH_MM_SS_DASH: "DD-MM-YYYY HH:mm:ss",
  YYYY_MM_DD: "YYYY-MM-DD",
  YYYY_MM_DD_HH_MM: "YYYY-MM-DD HH:mm",
  YYYY_MM_DD_HH_MM_SS: "YYYY-MM-DD HH:mm:ss",
} as const;

export type DateFormatKey = keyof typeof DateFormats;
export type DateInput = string | number | Date | Dayjs;

// =============================================================================
// TIMEZONE CONVERSION FUNCTIONS
// =============================================================================

/**
 * Parse Vietnam time string and convert to Unix timestamp
 * @param dateString - Date string in Vietnam timezone
 * @param format - Format of the input string
 * @returns Unix timestamp (seconds)
 */
export function parseVietnamTimeToUnix(
  dateString: string,
  format: string
): number {
  return dayjs.tz(dateString, format, VIETNAM_TIMEZONE).unix();
}

/**
 * Convert Unix timestamp to Vietnam time string
 * @param unixTimestamp - Unix timestamp (seconds)
 * @param format - Desired output format
 * @returns Formatted date string in Vietnam timezone
 */
export function parseUnixToVietnamTime(
  unixTimestamp: number,
  format: string
): string {
  return dayjs.unix(unixTimestamp).tz(VIETNAM_TIMEZONE).format(format);
}

/**
 * Convert any date input to Unix timestamp
 * @param date - Date input
 * @param inputFormat - Format if input is string
 * @param timezone - Timezone for parsing (default: Vietnam)
 * @returns Unix timestamp (seconds)
 */
export function toUnixTimestamp(
  date: DateInput,
  inputFormat?: string,
  timezone: string = VIETNAM_TIMEZONE
): number {
  if (typeof date === "string" && inputFormat) {
    return dayjs.tz(date, inputFormat, timezone).unix();
  }
  return dayjs(date).unix();
}

/**
 * Convert Unix timestamp to formatted string
 * @param unixTimestamp - Unix timestamp (seconds)
 * @param format - Output format
 * @param timezone - Target timezone (default: Vietnam)
 * @returns Formatted date string
 */
export function fromUnixTimestamp(
  unixTimestamp: number,
  format: string,
  timezone: string = VIETNAM_TIMEZONE
): string {
  return dayjs.unix(unixTimestamp).tz(timezone).format(format);
}

// =============================================================================
// CURRENT TIME FUNCTIONS
// =============================================================================

/**
 * Get current time in Vietnam timezone
 * @param format - Output format
 * @returns Current Vietnam time as formatted string
 */
export function getCurrentVietnamTime(format: string): string {
  return dayjs().tz(VIETNAM_TIMEZONE).format(format);
}

/**
 * Get current Unix timestamp
 * @returns Current Unix timestamp (seconds)
 */
export function getCurrentUnixTimestamp(): number {
  return dayjs().unix();
}

/**
 * Get current UTC time
 * @param format - Output format
 * @returns Current UTC time as formatted string
 */
export function getCurrentUtcTime(format: string): string {
  return dayjs().utc().format(format);
}

// =============================================================================
// DATE ARITHMETIC FUNCTIONS
// =============================================================================

/**
 * Add time to a date
 * @param date - Base date
 * @param amount - Amount to add
 * @param unit - Time unit
 * @param format - Output format (if string output desired)
 * @returns Dayjs object or formatted string
 */
export function addTime(
  date: DateInput,
  amount: number,
  unit: dayjs.ManipulateType,
  format?: string
): Dayjs | string {
  const result = dayjs(date).add(amount, unit);
  return format ? result.format(format) : result;
}

/**
 * Subtract time from a date
 * @param date - Base date
 * @param amount - Amount to subtract
 * @param unit - Time unit
 * @param format - Output format (if string output desired)
 * @returns Dayjs object or formatted string
 */
export function subtractTime(
  date: DateInput,
  amount: number,
  unit: dayjs.ManipulateType,
  format?: string
): Dayjs | string {
  const result = dayjs(date).subtract(amount, unit);
  return format ? result.format(format) : result;
}

// Specific arithmetic functions for common operations

/**
 * Add minutes to a date
 */
export function addMinutes(
  date: DateInput,
  minutes: number,
  format?: string
): Dayjs | string {
  return addTime(date, minutes, "minute", format);
}

/**
 * Add hours to a date
 */
export function addHours(
  date: DateInput,
  hours: number,
  format?: string
): Dayjs | string {
  return addTime(date, hours, "hour", format);
}

/**
 * Add days to a date
 */
export function addDays(
  date: DateInput,
  days: number,
  format?: string
): Dayjs | string {
  return addTime(date, days, "day", format);
}

/**
 * Add weeks to a date
 */
export function addWeeks(
  date: DateInput,
  weeks: number,
  format?: string
): Dayjs | string {
  return addTime(date, weeks, "week", format);
}

/**
 * Add months to a date
 */
export function addMonths(
  date: DateInput,
  months: number,
  format?: string
): Dayjs | string {
  return addTime(date, months, "month", format);
}

/**
 * Add years to a date
 */
export function addYears(
  date: DateInput,
  years: number,
  format?: string
): Dayjs | string {
  return addTime(date, years, "year", format);
}

// Subtract functions
export function subtractMinutes(
  date: DateInput,
  minutes: number,
  format?: string
): Dayjs | string {
  return subtractTime(date, minutes, "minute", format);
}

export function subtractHours(
  date: DateInput,
  hours: number,
  format?: string
): Dayjs | string {
  return subtractTime(date, hours, "hour", format);
}

export function subtractDays(
  date: DateInput,
  days: number,
  format?: string
): Dayjs | string {
  return subtractTime(date, days, "day", format);
}

export function subtractWeeks(
  date: DateInput,
  weeks: number,
  format?: string
): Dayjs | string {
  return subtractTime(date, weeks, "week", format);
}

export function subtractMonths(
  date: DateInput,
  months: number,
  format?: string
): Dayjs | string {
  return subtractTime(date, months, "month", format);
}

export function subtractYears(
  date: DateInput,
  years: number,
  format?: string
): Dayjs | string {
  return subtractTime(date, years, "year", format);
}

// =============================================================================
// DATE COMPARISON FUNCTIONS
// =============================================================================

/**
 * Check if first date is before second date
 */
export function isDateBefore(
  date1: DateInput,
  date2: DateInput,
  unit?: dayjs.OpUnitType
): boolean {
  return dayjs(date1).isBefore(dayjs(date2), unit);
}

/**
 * Check if first date is after second date
 */
export function isDateAfter(
  date1: DateInput,
  date2: DateInput,
  unit?: dayjs.OpUnitType
): boolean {
  return dayjs(date1).isAfter(dayjs(date2), unit);
}

/**
 * Check if first date is same as second date
 */
export function isDateSame(
  date1: DateInput,
  date2: DateInput,
  unit?: dayjs.OpUnitType
): boolean {
  return dayjs(date1).isSame(dayjs(date2), unit);
}

/**
 * Check if first date is same or before second date
 */
export function isDateSameOrBefore(
  date1: DateInput,
  date2: DateInput,
  unit?: dayjs.OpUnitType
): boolean {
  return dayjs(date1).isSameOrBefore(dayjs(date2), unit);
}

/**
 * Check if first date is same or after second date
 */
export function isDateSameOrAfter(
  date1: DateInput,
  date2: DateInput,
  unit?: dayjs.OpUnitType
): boolean {
  return dayjs(date1).isSameOrAfter(dayjs(date2), unit);
}

/**
 * Check if date is between two dates
 */
export function isDateBetween(
  date: DateInput,
  startDate: DateInput,
  endDate: DateInput,
  unit?: dayjs.OpUnitType,
  inclusivity?: "()" | "[)" | "(]" | "[]"
): boolean {
  return dayjs(date).isBetween(
    dayjs(startDate),
    dayjs(endDate),
    unit,
    inclusivity
  );
}

// =============================================================================
// DATE DIFFERENCE FUNCTIONS
// =============================================================================

/**
 * Get difference between two dates
 */
export function getDateDifference(
  date1: DateInput,
  date2: DateInput,
  unit: dayjs.QUnitType,
  precise: boolean = false
): number {
  return dayjs(date1).diff(dayjs(date2), unit, precise);
}

/**
 * Get difference in minutes
 */
export function getDifferenceInMinutes(
  date1: DateInput,
  date2: DateInput,
  precise: boolean = false
): number {
  return getDateDifference(date1, date2, "minute", precise);
}

/**
 * Get difference in hours
 */
export function getDifferenceInHours(
  date1: DateInput,
  date2: DateInput,
  precise: boolean = false
): number {
  return getDateDifference(date1, date2, "hour", precise);
}

/**
 * Get difference in days
 */
export function getDifferenceInDays(
  date1: DateInput,
  date2: DateInput,
  precise: boolean = false
): number {
  return getDateDifference(date1, date2, "day", precise);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get relative time from now (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTime(date: DateInput): string {
  return dayjs(date).fromNow();
}

/**
 * Get relative time between two dates
 */
export function getRelativeTimeBetween(
  date1: DateInput,
  date2: DateInput
): string {
  return dayjs(date1).from(dayjs(date2));
}

/**
 * Check if a year is leap year
 */
export function checkIsLeapYear(year: number): boolean {
  return dayjs(`${year}-01-01`).isLeapYear();
}

/**
 * Get start of day/week/month/year
 */
export function startOf(
  date: DateInput,
  unit: dayjs.OpUnitType,
  format?: string
): Dayjs | string {
  const result = dayjs(date).startOf(unit);
  return format ? result.format(format) : result;
}

/**
 * Get end of day/week/month/year
 */
export function endOf(
  date: DateInput,
  unit: dayjs.OpUnitType,
  format?: string
): Dayjs | string {
  const result = dayjs(date).endOf(unit);
  return format ? result.format(format) : result;
}

/**
 * Format date with specified format
 */
export function formatDate(
  date: DateInput,
  format: string,
  timezone?: string
): string {
  const dayjsObj = dayjs(date);
  if (timezone) {
    return dayjsObj.tz(timezone).format(format);
  }
  return dayjsObj.format(format);
}

/**
 * Validate if a date string matches the expected format
 */
export function isValidDate(dateString: string, format: string): boolean {
  return dayjs(dateString, format, true).isValid();
}
