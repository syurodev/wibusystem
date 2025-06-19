/**
 * Object utilities for manipulation, comparison, and transformation
 * @fileoverview Comprehensive object handling utilities with type safety
 */

// Constants
const DEFAULT_VALUES = {
  MAX_DEPTH: 10,
} as const;

/**
 * Deep clone options
 */
export interface DeepCloneOptions {
  /** Maximum depth to clone */
  maxDepth?: number;
  /** Whether to clone functions */
  cloneFunctions?: boolean;
}

/**
 * Object comparison options
 */
export interface CompareOptions {
  /** Maximum depth to compare */
  maxDepth?: number;
  /** Ignore specific keys */
  ignoreKeys?: string[];
}

/**
 * Flatten options
 */
export interface FlattenOptions {
  /** Separator for nested keys */
  separator?: string;
  /** Maximum depth to flatten */
  maxDepth?: number;
  /** Prefix for keys */
  prefix?: string;
}

/**
 * Deep clones an object
 */
export function deepClone<T>(obj: T, options: DeepCloneOptions = {}): T {
  const { maxDepth = DEFAULT_VALUES.MAX_DEPTH, cloneFunctions = false } =
    options;

  const cloneCache = new WeakMap();

  function clone(value: any, depth: number): any {
    // Handle primitive types and null
    if (value === null || typeof value !== "object") {
      return handlePrimitiveClone(value, cloneFunctions);
    }

    // Check max depth
    if (depth >= maxDepth) {
      return value;
    }

    // Handle circular references
    if (cloneCache.has(value)) {
      return cloneCache.get(value);
    }

    return cloneComplexValue(value, depth, clone, cloneCache);
  }

  return clone(obj, 0);
}

/**
 * Handles cloning of primitive values
 */
function handlePrimitiveClone(value: any, cloneFunctions: boolean): any {
  if (typeof value === "function" && !cloneFunctions) {
    return value;
  }
  return value;
}

/**
 * Handles cloning of complex values (objects, arrays, etc.)
 */
function cloneComplexValue(
  value: any,
  depth: number,
  cloneFn: (val: any, d: number) => any,
  cache: WeakMap<any, any>
): any {
  // Handle Date
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  // Handle Array
  if (Array.isArray(value)) {
    return cloneArray(value, depth, cloneFn, cache);
  }

  // Handle plain objects
  return cloneObject(value, depth, cloneFn, cache);
}

/**
 * Clones an array
 */
function cloneArray(
  arr: any[],
  depth: number,
  cloneFn: (val: any, d: number) => any,
  cache: WeakMap<any, any>
): any[] {
  const clonedArray: any[] = [];
  cache.set(arr, clonedArray);

  for (let i = 0; i < arr.length; i++) {
    clonedArray[i] = cloneFn(arr[i], depth + 1);
  }

  return clonedArray;
}

/**
 * Clones a plain object
 */
function cloneObject(
  obj: any,
  depth: number,
  cloneFn: (val: any, d: number) => any,
  cache: WeakMap<any, any>
): any {
  const clonedObj: any = {};
  cache.set(obj, clonedObj);

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      clonedObj[key] = cloneFn(obj[key], depth + 1);
    }
  }

  return clonedObj;
}

/**
 * Deep merges objects
 */
export function deepMerge<T extends Record<string, any>>(
  target: T,
  ...sources: Array<Record<string, any>>
): T {
  if (!sources.length) return target;

  const source = sources.shift();
  if (!source) return deepMerge(target, ...sources);

  if (isObject(target) && isObject(source)) {
    mergeObjectProperties(target, source);
  }

  return deepMerge(target, ...sources);
}

/**
 * Merges properties from source to target
 */
function mergeObjectProperties(target: any, source: any): void {
  for (const key in source) {
    if (Object.hasOwn(source, key)) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
}

/**
 * Deep compares two objects for equality
 */
export function deepEqual(
  a: any,
  b: any,
  options: CompareOptions = {}
): boolean {
  const { maxDepth = DEFAULT_VALUES.MAX_DEPTH, ignoreKeys = [] } = options;

  function compare(valueA: any, valueB: any, depth: number): boolean {
    // Same reference
    if (valueA === valueB) return true;

    // Check max depth
    if (depth >= maxDepth) return valueA === valueB;

    // Handle null and undefined
    if (valueA == null || valueB == null) {
      return valueA === valueB;
    }

    // Different types
    if (typeof valueA !== typeof valueB) return false;

    // Handle primitive types
    if (typeof valueA !== "object") {
      return valueA === valueB;
    }

    return compareComplexValues(valueA, valueB, depth, ignoreKeys, compare);
  }

  return compare(a, b, 0);
}

/**
 * Compares complex values (objects, arrays, dates, etc.)
 */
function compareComplexValues(
  valueA: any,
  valueB: any,
  depth: number,
  ignoreKeys: string[],
  compareFn: (a: any, b: any, d: number) => boolean
): boolean {
  // Handle Date
  if (valueA instanceof Date && valueB instanceof Date) {
    return valueA.getTime() === valueB.getTime();
  }

  // Handle RegExp
  if (valueA instanceof RegExp && valueB instanceof RegExp) {
    return valueA.toString() === valueB.toString();
  }

  // Handle Array
  if (Array.isArray(valueA) && Array.isArray(valueB)) {
    return compareArrays(valueA, valueB, depth, compareFn);
  }

  // Handle plain objects
  return compareObjects(valueA, valueB, depth, ignoreKeys, compareFn);
}

/**
 * Compares two arrays
 */
function compareArrays(
  arrA: any[],
  arrB: any[],
  depth: number,
  compareFn: (a: any, b: any, d: number) => boolean
): boolean {
  if (arrA.length !== arrB.length) return false;

  for (let i = 0; i < arrA.length; i++) {
    if (!compareFn(arrA[i], arrB[i], depth + 1)) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two objects
 */
function compareObjects(
  objA: any,
  objB: any,
  depth: number,
  ignoreKeys: string[],
  compareFn: (a: any, b: any, d: number) => boolean
): boolean {
  const keysA = Object.keys(objA).filter((key) => !ignoreKeys.includes(key));
  const keysB = Object.keys(objB).filter((key) => !ignoreKeys.includes(key));

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!compareFn(objA[key], objB[key], depth + 1)) {
      return false;
    }
  }

  return true;
}

/**
 * Flattens nested object
 */
export function flatten(
  obj: Record<string, any>,
  options: FlattenOptions = {}
): Record<string, any> {
  const {
    separator = ".",
    maxDepth = DEFAULT_VALUES.MAX_DEPTH,
    prefix = "",
  } = options;

  const result: Record<string, any> = {};

  function flattenRecursive(current: any, prop: string, depth: number): void {
    if (depth >= maxDepth || !isObject(current)) {
      result[prop] = current;
      return;
    }

    if (Array.isArray(current)) {
      flattenArray(current, prop, separator, depth, flattenRecursive);
    } else {
      flattenObject(current, prop, separator, depth, flattenRecursive);
    }
  }

  flattenRecursive(obj, prefix, 0);
  return result;
}

/**
 * Flattens an array
 */
function flattenArray(
  arr: any[],
  prop: string,
  separator: string,
  depth: number,
  flattenFn: (current: any, prop: string, depth: number) => void
): void {
  for (let i = 0; i < arr.length; i++) {
    const newProp = prop ? `${prop}${separator}${i}` : `${i}`;
    flattenFn(arr[i], newProp, depth + 1);
  }
}

/**
 * Flattens an object
 */
function flattenObject(
  obj: any,
  prop: string,
  separator: string,
  depth: number,
  flattenFn: (current: any, prop: string, depth: number) => void
): void {
  let isEmpty = true;
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      isEmpty = false;
      const newProp = prop ? `${prop}${separator}${key}` : key;
      flattenFn(obj[key], newProp, depth + 1);
    }
  }
  if (isEmpty && prop) {
    // This will be handled by the result assignment in flattenRecursive
  }
}

/**
 * Unflattens a flattened object
 */
export function unflatten(
  obj: Record<string, any>,
  separator: string = "."
): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      unflattenKey(key, obj[key], separator, result);
    }
  }

  return result;
}

/**
 * Unflattens a single key-value pair
 */
function unflattenKey(
  key: string,
  value: any,
  separator: string,
  result: Record<string, any>
): void {
  const keys = key.split(separator);
  let current = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const currentKey = keys[i];
    const nextKey = keys[i + 1];

    if (!currentKey) continue;

    if (!current[currentKey]) {
      // Check if next key is array index
      const isArrayIndex = nextKey && /^\d+$/.test(nextKey);
      current[currentKey] = isArrayIndex ? [] : {};
    }

    current = current[currentKey];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * Gets value from nested object path
 */
export function getNestedValue<T = any>(
  obj: Record<string, any>,
  path: string | string[],
  defaultValue?: T
): T {
  const keys = Array.isArray(path) ? path : path.split(".");
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
 * Sets value in nested object path (simplified version)
 */
export function setNestedValue(
  obj: Record<string, any>,
  path: string | string[],
  value: any
): void {
  const keys = Array.isArray(path) ? path : path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!key) continue;

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }

    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }
}

/**
 * Checks if value is a plain object
 */
export function isObject(value: any): value is Record<string, any> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}

/**
 * Checks if object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true;

  if (Array.isArray(obj) || typeof obj === "string") {
    return obj.length === 0;
  }

  if (isObject(obj)) {
    return Object.keys(obj).length === 0;
  }

  return false;
}

/**
 * Picks specified properties from object
 */
export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }

  return result;
}

/**
 * Omits specified properties from object
 */
export function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj } as any;

  for (const key of keys) {
    delete result[key];
  }

  return result;
}

/**
 * Maps object values
 */
export function mapValues<T extends Record<string, any>, U>(
  obj: T,
  mapper: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  const result = {} as Record<keyof T, U>;

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      result[key] = mapper(obj[key], key);
    }
  }

  return result;
}

/**
 * Filters object properties
 */
export function filterObject<T extends Record<string, any>>(
  obj: T,
  predicate: (value: T[keyof T], key: keyof T) => boolean
): Partial<T> {
  const result = {} as Partial<T>;

  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      if (predicate(obj[key], key)) {
        result[key] = obj[key];
      }
    }
  }

  return result;
}

/**
 * Transforms object with Vietnamese-specific handling
 */
export function transformObjectForVietnamese<T extends Record<string, any>>(
  obj: T,
  options: {
    /** Convert date values to Vietnam timezone */
    convertDates?: boolean;
    /** Format numbers as Vietnamese */
    formatNumbers?: boolean;
    /** Remove accents from string keys */
    normalizeKeys?: boolean;
  } = {}
): T {
  const {
    convertDates = false,
    formatNumbers = false,
    normalizeKeys = false,
  } = options;

  function transform(value: any): any {
    if (value instanceof Date && convertDates) {
      return transformDate(value);
    }

    if (typeof value === "number" && formatNumbers) {
      return transformNumber(value);
    }

    if (Array.isArray(value)) {
      return value.map(transform);
    }

    if (isObject(value)) {
      return transformObject(value, normalizeKeys, transform);
    }

    return value;
  }

  return transform(obj);
}

/**
 * Transforms a date to Vietnam timezone
 */
function transformDate(date: Date): Date {
  // Convert to Vietnam timezone (UTC+7)
  return new Date(date.getTime() + 7 * 60 * 60 * 1000);
}

/**
 * Transforms a number to Vietnamese format
 */
function transformNumber(num: number): string {
  // Format numbers with Vietnamese thousand separators
  return num.toLocaleString("vi-VN");
}

/**
 * Transforms an object with key normalization
 */
function transformObject(
  obj: any,
  normalizeKeys: boolean,
  transformFn: (value: any) => any
): any {
  const result: any = {};
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      let newKey = key;
      if (normalizeKeys && typeof key === "string") {
        newKey = normalizeVietnameseKey(key);
      }
      result[newKey] = transformFn(obj[key]);
    }
  }
  return result;
}

/**
 * Normalizes Vietnamese key by removing accents
 */
function normalizeVietnameseKey(key: string): string {
  return key
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}
