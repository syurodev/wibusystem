import { DateTime } from "luxon";
import { COMMON_DATE_FORMATS, TIMEZONES } from "./constants";
import { fromMillisToDateTime } from "./convert";

/**
 * Formats a Luxon DateTime object into a string.
 * @param dt The Luxon DateTime object.
 * @param format The format string (e.g., 'dd/MM/yyyy HH:mm'). Defaults to COMMON_DATE_FORMATS.DATE_TIME.
 * @param locale The locale string (e.g., 'en-US', 'vi-VN'). Defaults to 'en-US'.
 * @returns The formatted date string.
 */
export const formatDateTime = (
  dt: DateTime,
  format: string = COMMON_DATE_FORMATS.DATE_TIME,
  locale: string = "en-US"
): string => {
  return dt.setLocale(locale).toFormat(format);
};

/**
 * Formats a Unix timestamp (milliseconds) into a string.
 * @param ms Unix timestamp in milliseconds.
 * @param format The format string. Defaults to COMMON_DATE_FORMATS.DATE_TIME.
 * @param zone The IANA zone string for displaying the time (e.g., TIMEZONES.UTC, TIMEZONES.ASIA_HO_CHI_MINH). Defaults to TIMEZONES.UTC.
 * @param locale The locale string. Defaults to 'en-US'.
 * @returns The formatted date string.
 */
export const formatMillis = (
  ms: number,
  format: string = COMMON_DATE_FORMATS.DATE_TIME,
  zone: string = TIMEZONES.UTC,
  locale: string = "en-US"
): string => {
  const dt = fromMillisToDateTime(ms, zone);
  return formatDateTime(dt, format, locale);
};
