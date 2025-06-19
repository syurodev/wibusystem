/**
 * Utils package - Common utility functions
 * @packageDocumentation
 */

/**
 * Checks if a value is not null or undefined
 * @param value - The value to check
 * @returns true if value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely gets a nested property from an object
 * @param obj - The object to get property from
 * @param path - The property path (e.g., 'user.profile.name')
 * @param defaultValue - Default value if property doesn't exist
 * @returns The property value or default value
 */
export function get<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T
): T {
  const keys = path.split(".");
  let result: any = obj;

  for (const key of keys) {
    if (result == null || typeof result !== "object") {
      return defaultValue as T;
    }
    result = result[key];
  }

  return result !== undefined ? result : (defaultValue as T);
}

/**
 * Debounces a function call
 * @param func - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: Timer | undefined;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Creates a delay (sleep) function
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamps a number between min and max values
 * @param value - The number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Export all date utilities
export * from "./date-utils";

// Export all Vietnamese i18n utilities
export * from "./date-i18n";

// Export all string utilities
export * from "./string-utils";

// Export all number utilities
export * from "./number-utils";

// Export all currency utilities
export * from "./currency-utils";

// Export all object utilities
export * from "./object-utils";

// Export all response utilities
export * from "./response-utils";
