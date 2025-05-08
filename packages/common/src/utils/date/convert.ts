import { DateTime } from "luxon";
import { TIMEZONES } from "./constants";

// Set default Luxon settings if needed, e.g., default locale or timezone for new DateTimes not from specific inputs.
// Settings.defaultZone = TIMEZONES.UTC; // This would make ALL new DateTimes default to UTC.
// It's often better to be explicit in functions as done below.

/**
 * Converts a Unix timestamp (milliseconds) to a Luxon DateTime object.
 * @param ms Unix timestamp in milliseconds.
 * @param zone The IANA zone string (e.g., TIMEZONES.UTC, TIMEZONES.ASIA_HO_CHI_MINH). Defaults to TIMEZONES.UTC.
 * @returns A Luxon DateTime object.
 */
export const fromMillisToDateTime = (
  ms: number,
  zone: string = TIMEZONES.UTC
): DateTime => {
  return DateTime.fromMillis(ms, { zone });
};

/**
 * Converts a Unix timestamp (seconds) to a Luxon DateTime object.
 * @param seconds Unix timestamp in seconds.
 * @param zone The IANA zone string (e.g., TIMEZONES.UTC, TIMEZONES.ASIA_HO_CHI_MINH). Defaults to TIMEZONES.UTC.
 * @returns A Luxon DateTime object.
 */
export const fromSecondsToDateTime = (
  seconds: number,
  zone: string = TIMEZONES.UTC
): DateTime => {
  return DateTime.fromSeconds(seconds, { zone });
};

/**
 * Converts a Luxon DateTime object to a Unix timestamp (milliseconds).
 * @param dt The Luxon DateTime object.
 * @returns Unix timestamp in milliseconds.
 */
export const toMillisFromDateTime = (dt: DateTime): number => {
  return dt.toMillis();
};

/**
 * Converts a Luxon DateTime object to a Unix timestamp (seconds).
 * This will return a number, potentially with a fractional part.
 * Use Math.floor() if an integer is strictly required.
 * @param dt The Luxon DateTime object.
 * @returns Unix timestamp in seconds.
 */
export const toSecondsFromDateTime = (dt: DateTime): number => {
  return dt.toSeconds();
};

/**
 * Creates a Luxon DateTime object for the current time in the specified zone.
 * @param zone The IANA zone string (e.g., TIMEZONES.UTC, TIMEZONES.ASIA_HO_CHI_MINH). Defaults to TIMEZONES.UTC.
 * @returns A Luxon DateTime object representing the current time.
 */
export const now = (zone: string = TIMEZONES.UTC): DateTime => {
  return DateTime.now().setZone(zone);
};
