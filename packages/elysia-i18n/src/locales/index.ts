import * as en from "./en";
import * as vi from "./vi";

/**
 * All available translations
 */
export const resources = {
  en,
  vi,
} as const;

/**
 * Available locale codes
 */
export const supportedLocales = Object.keys(resources) as Array<
  keyof typeof resources
>;

/**
 * Default locale
 */
export const defaultLocale = "en" as const;

/**
 * Fallback locale when translation is missing
 */
export const fallbackLocale = "en" as const;

// Export individual locales
export { en, vi };
