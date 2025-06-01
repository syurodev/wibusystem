/**
 * Common date and time formats to be used with Luxon.
 */
export const COMMON_DATE_FORMATS = {
  /** Example: 25/12/2023 */
  DATE_ONLY: "dd/MM/yyyy",
  /** Example: 25/12/2023 14:30:00 */
  DATE_TIME: "dd/MM/yyyy HH:mm:ss",
  /** Example: 2023-12-25T14:30:00Z (ISO 8601 UTC) */
  ISO_DATE_TIME_UTC: "yyyy-MM-dd'T'HH:mm:ss'Z'",
  /** Example: 2023-12-25T14:30:00.000+07:00 (ISO 8601 with offset) */
  ISO_DATE_TIME_WITH_OFFSET: "yyyy-MM-dd'T'HH:mm:ss.SSSZZ",
  /** Example: 14:30 */
  TIME_ONLY_SHORT: "HH:mm",
  /** Example: 14:30:00 */
  TIME_ONLY_FULL: "HH:mm:ss",
};

/**
 * Common IANA timezone strings.
 */
export const TIMEZONES = {
  UTC: "utc",
  ASIA_HO_CHI_MINH: "Asia/Ho_Chi_Minh",
};
