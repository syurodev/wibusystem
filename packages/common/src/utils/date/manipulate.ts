import { DateTime, DurationLike } from "luxon";

/**
 * Adds a duration to a DateTime object.
 * @param dt The initial DateTime object.
 * @param duration The duration to add. Can be a Luxon Duration object or a DurationLike object (e.g., { days: 1, hours: 2 }).
 * @returns A new DateTime object with the duration added.
 */
export const addDuration = (dt: DateTime, duration: DurationLike): DateTime => {
  return dt.plus(duration);
};

/**
 * Subtracts a duration from a DateTime object.
 * @param dt The initial DateTime object.
 * @param duration The duration to subtract. Can be a Luxon Duration object or a DurationLike object (e.g., { days: 1, hours: 2 }).
 * @returns A new DateTime object with the duration subtracted.
 */
export const subtractDuration = (
  dt: DateTime,
  duration: DurationLike
): DateTime => {
  return dt.minus(duration);
};

/**
 * Adds a specified number of years to a DateTime object.
 * @param dt The initial DateTime object.
 * @param years The number of years to add.
 * @returns A new DateTime object with the years added.
 */
export const addYears = (dt: DateTime, years: number): DateTime => {
  return dt.plus({ years });
};

/**
 * Adds a specified number of months to a DateTime object.
 * @param dt The initial DateTime object.
 * @param months The number of months to add.
 * @returns A new DateTime object with the months added.
 */
export const addMonths = (dt: DateTime, months: number): DateTime => {
  return dt.plus({ months });
};

/**
 * Adds a specified number of days to a DateTime object.
 * @param dt The initial DateTime object.
 * @param days The number of days to add.
 * @returns A new DateTime object with the days added.
 */
export const addDays = (dt: DateTime, days: number): DateTime => {
  return dt.plus({ days });
};

/**
 * Adds a specified number of hours to a DateTime object.
 * @param dt The initial DateTime object.
 * @param hours The number of hours to add.
 * @returns A new DateTime object with the hours added.
 */
export const addHours = (dt: DateTime, hours: number): DateTime => {
  return dt.plus({ hours });
};

/**
 * Adds a specified number of minutes to a DateTime object.
 * @param dt The initial DateTime object.
 * @param minutes The number of minutes to add.
 * @returns A new DateTime object with the minutes added.
 */
export const addMinutes = (dt: DateTime, minutes: number): DateTime => {
  return dt.plus({ minutes });
};

/**
 * Adds a specified number of seconds to a DateTime object.
 * @param dt The initial DateTime object.
 * @param seconds The number of seconds to add.
 * @returns A new DateTime object with the seconds added.
 */
export const addSeconds = (dt: DateTime, seconds: number): DateTime => {
  return dt.plus({ seconds });
};

// Corresponding subtract functions

/**
 * Subtracts a specified number of years from a DateTime object.
 * @param dt The initial DateTime object.
 * @param years The number of years to subtract.
 * @returns A new DateTime object with the years subtracted.
 */
export const subtractYears = (dt: DateTime, years: number): DateTime => {
  return dt.minus({ years });
};

/**
 * Subtracts a specified number of months from a DateTime object.
 * @param dt The initial DateTime object.
 * @param months The number of months to subtract.
 * @returns A new DateTime object with the months subtracted.
 */
export const subtractMonths = (dt: DateTime, months: number): DateTime => {
  return dt.minus({ months });
};

/**
 * Subtracts a specified number of days from a DateTime object.
 * @param dt The initial DateTime object.
 * @param days The number of days to subtract.
 * @returns A new DateTime object with the days subtracted.
 */
export const subtractDays = (dt: DateTime, days: number): DateTime => {
  return dt.minus({ days });
};

/**
 * Subtracts a specified number of hours from a DateTime object.
 * @param dt The initial DateTime object.
 * @param hours The number of hours to subtract.
 * @returns A new DateTime object with the hours subtracted.
 */
export const subtractHours = (dt: DateTime, hours: number): DateTime => {
  return dt.minus({ hours });
};

/**
 * Subtracts a specified number of minutes from a DateTime object.
 * @param dt The initial DateTime object.
 * @param minutes The number of minutes to subtract.
 * @returns A new DateTime object with the minutes subtracted.
 */
export const subtractMinutes = (dt: DateTime, minutes: number): DateTime => {
  return dt.minus({ minutes });
};

/**
 * Subtracts a specified number of seconds from a DateTime object.
 * @param dt The initial DateTime object.
 * @param seconds The number of seconds to subtract.
 * @returns A new DateTime object with the seconds subtracted.
 */
export const subtractSeconds = (dt: DateTime, seconds: number): DateTime => {
  return dt.minus({ seconds });
};
