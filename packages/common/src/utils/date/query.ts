import { DateTime, DurationLike } from "luxon";

/**
 * Checks if the first DateTime is before the second DateTime.
 * @param dt1 The first DateTime object.
 * @param dt2 The second DateTime object.
 * @returns True if dt1 is before dt2, false otherwise.
 */
export const isBefore = (dt1: DateTime, dt2: DateTime): boolean => {
  return dt1 < dt2;
};

/**
 * Checks if the first DateTime is after the second DateTime.
 * @param dt1 The first DateTime object.
 * @param dt2 The second DateTime object.
 * @returns True if dt1 is after dt2, false otherwise.
 */
export const isAfter = (dt1: DateTime, dt2: DateTime): boolean => {
  return dt1 > dt2;
};

/**
 * Checks if two DateTime objects are the same up to a specified unit.
 * For example, to check if they are the same day, use unit 'day'.
 * @param dt1 The first DateTime object.
 * @param dt2 The second DateTime object.
 * @param unit The unit to compare (e.g., 'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond').
 * @returns True if dt1 and dt2 are the same up to the specified unit, false otherwise.
 */
export const isSame = (
  dt1: DateTime,
  dt2: DateTime,
  unit: keyof DurationLike
): boolean => {
  return dt1.hasSame(dt2, unit);
};

/**
 * Checks if two DateTime objects fall on the same day.
 * @param dt1 The first DateTime object.
 * @param dt2 The second DateTime object.
 * @returns True if both DateTimes are on the same day, false otherwise.
 */
export const isSameDay = (dt1: DateTime, dt2: DateTime): boolean => {
  return dt1.hasSame(dt2, "day");
};

/**
 * Checks if two DateTime objects fall on the same hour of the same day.
 * @param dt1 The first DateTime object.
 * @param dt2 The second DateTime object.
 * @returns True if both DateTimes are on the same hour of the same day, false otherwise.
 */
export const isSameHour = (dt1: DateTime, dt2: DateTime): boolean => {
  return dt1.hasSame(dt2, "hour");
};

/**
 * Checks if two DateTime objects fall on the same minute of the same hour.
 * @param dt1 The first DateTime object.
 * @param dt2 The second DateTime object.
 * @returns True if both DateTimes are on the same minute of the same hour, false otherwise.
 */
export const isSameMinute = (dt1: DateTime, dt2: DateTime): boolean => {
  return dt1.hasSame(dt2, "minute");
};

/**
 * Checks if a DateTime is between two other DateTimes.
 * Boundaries are exclusive by default.
 * @param dt The DateTime object to check.
 * @param startDt The start DateTime object.
 * @param endDt The end DateTime object.
 * @param options Options for inclusivity: { includeStart?: boolean, includeEnd?: boolean }.
 * @returns True if dt is between startDt and endDt, false otherwise.
 */
export const isBetween = (
  dt: DateTime,
  startDt: DateTime,
  endDt: DateTime,
  options?: { includeStart?: boolean; includeEnd?: boolean }
): boolean => {
  const { includeStart = false, includeEnd = false } = options || {};
  const afterStart = includeStart ? dt >= startDt : dt > startDt;
  const beforeEnd = includeEnd ? dt <= endDt : dt < endDt;
  return afterStart && beforeEnd;
};
