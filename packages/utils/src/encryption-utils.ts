/**
 * Encryption utilities for securing sensitive data
 * Works on both client and server environments
 */

import { getCurrentUnixTimestamp } from "./date-utils";

// Types
export interface EncryptionResult {
  data: string;
  iv?: string;
  timestamp: number;
  method: "xor-cipher" | "base64-obfuscated" | "multi-layer";
}

export interface EncryptionConfig {
  secretKey: string;
  useTimestamp?: boolean;
  expirationMinutes?: number;
}

/**
 * Simple XOR cipher - lightweight và đơn giản, với Unicode support
 * @param data - Dữ liệu cần mã hóa
 * @param key - Secret key
 * @returns Encrypted string
 */
export function xorCipher(data: string, key: string): string {
  // Convert Unicode string to UTF-8 bytes first
  const utf8Data = encodeURIComponent(data);

  let result = "";
  for (let i = 0; i < utf8Data.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const dataChar = utf8Data.charCodeAt(i);
    result += String.fromCharCode(dataChar ^ keyChar);
  }

  // Convert result to hex để tránh btoa() issues
  let hexResult = "";
  for (let i = 0; i < result.length; i++) {
    const hex = result.charCodeAt(i).toString(16).padStart(2, "0");
    hexResult += hex;
  }

  return btoa(hexResult); // Base64 encode hex string
}

/**
 * Decrypt XOR cipher với Unicode support
 * @param encryptedData - Encrypted data (base64)
 * @param key - Secret key
 * @returns Decrypted string
 */
export function xorDecipher(encryptedData: string, key: string): string {
  // Decode base64 to get hex string
  const hexString = atob(encryptedData);

  // Convert hex back to binary string
  let binaryString = "";
  for (let i = 0; i < hexString.length; i += 2) {
    const hexByte = hexString.substr(i, 2);
    binaryString += String.fromCharCode(parseInt(hexByte, 16));
  }

  // XOR decrypt
  let result = "";
  for (let i = 0; i < binaryString.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const dataChar = binaryString.charCodeAt(i);
    result += String.fromCharCode(dataChar ^ keyChar);
  }

  // Decode URI component to get original Unicode string
  try {
    return decodeURIComponent(result);
  } catch (error) {
    // Fallback if URI decoding fails
    return result;
  }
}

/**
 * Base64 với obfuscation - đơn giản nhưng có thêm layer bảo mật, với Unicode support
 * @param data - Dữ liệu cần mã hóa
 * @param salt - Salt string
 * @returns Obfuscated string
 */
export function base64Obfuscate(data: string, salt: string): string {
  const saltedData = salt + data + salt.split("").reverse().join("");
  // Use encodeURIComponent to handle Unicode characters safely
  const utf8Data = encodeURIComponent(saltedData);
  const encoded = btoa(utf8Data);

  // Simple character substitution
  return encoded
    .replace(/A/g, "9")
    .replace(/B/g, "8")
    .replace(/C/g, "7")
    .replace(/D/g, "6")
    .replace(/E/g, "5")
    .replace(/=/g, "X");
}

/**
 * Deobfuscate Base64 với Unicode support
 * @param obfuscatedData - Obfuscated data
 * @param salt - Salt string
 * @returns Original data
 */
export function base64Deobfuscate(
  obfuscatedData: string,
  salt: string
): string {
  const decoded = obfuscatedData
    .replace(/9/g, "A")
    .replace(/8/g, "B")
    .replace(/7/g, "C")
    .replace(/6/g, "D")
    .replace(/5/g, "E")
    .replace(/X/g, "=");

  const utf8Data = atob(decoded);
  const saltedData = decodeURIComponent(utf8Data);
  const originalData = saltedData.slice(salt.length, -salt.length);
  return originalData;
}

/**
 * Multi-layer encryption: XOR + Base64 obfuscation + character rotation
 * @param data - Dữ liệu cần mã hóa
 * @param secretKey - Secret key
 * @returns Encrypted string
 */
export function multiLayerEncrypt(data: string, secretKey: string): string {
  // Layer 1: XOR cipher
  const xorEncrypted = xorCipher(data, secretKey);

  // Layer 2: Base64 obfuscation with key-derived salt
  const salt = secretKey.split("").reverse().join("").substring(0, 8);
  const obfuscated = base64Obfuscate(xorEncrypted, salt);

  // Layer 3: Character rotation based on key
  const keySum = secretKey
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const rotation = keySum % 26;

  let rotated = "";
  for (let i = 0; i < obfuscated.length; i++) {
    const char = obfuscated[i];
    if (char && char >= "A" && char <= "Z") {
      rotated += String.fromCharCode(
        ((char.charCodeAt(0) - 65 + rotation) % 26) + 65
      );
    } else if (char && char >= "a" && char <= "z") {
      rotated += String.fromCharCode(
        ((char.charCodeAt(0) - 97 + rotation) % 26) + 97
      );
    } else {
      rotated += char || "";
    }
  }

  return rotated;
}

/**
 * Multi-layer decryption
 * @param encryptedData - Data từ multiLayerEncrypt
 * @param secretKey - Secret key
 * @returns Decrypted string
 */
export function multiLayerDecrypt(
  encryptedData: string,
  secretKey: string
): string {
  // Layer 3: Reverse character rotation
  const keySum = secretKey
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const rotation = keySum % 26;

  let unrotated = "";
  for (let i = 0; i < encryptedData.length; i++) {
    const char = encryptedData[i];
    if (char && char >= "A" && char <= "Z") {
      unrotated += String.fromCharCode(
        ((char.charCodeAt(0) - 65 - rotation + 26) % 26) + 65
      );
    } else if (char && char >= "a" && char <= "z") {
      unrotated += String.fromCharCode(
        ((char.charCodeAt(0) - 97 - rotation + 26) % 26) + 97
      );
    } else {
      unrotated += char || "";
    }
  }

  // Layer 2: Reverse Base64 obfuscation
  const salt = secretKey.split("").reverse().join("").substring(0, 8);
  const deobfuscated = base64Deobfuscate(unrotated, salt);

  // Layer 1: Reverse XOR cipher
  const decrypted = xorDecipher(deobfuscated, secretKey);

  return decrypted;
}

/**
 * High-level encryption function với multiple methods
 * @param data - Dữ liệu cần mã hóa
 * @param config - Encryption configuration
 * @returns Promise<EncryptionResult>
 */
export async function encryptDeviceData(
  data: object | string,
  config: EncryptionConfig
): Promise<EncryptionResult> {
  const jsonData = typeof data === "string" ? data : JSON.stringify(data);

  // Add timestamp if requested
  const payload = config.useTimestamp
    ? {
        data: jsonData,
        timestamp: getCurrentUnixTimestamp(),
        expires: config.expirationMinutes
          ? getCurrentUnixTimestamp() + config.expirationMinutes * 60 * 1000
          : null,
      }
    : jsonData;

  const dataToEncrypt =
    typeof payload === "object" ? JSON.stringify(payload) : payload;

  // Use multi-layer encryption
  const encrypted = multiLayerEncrypt(dataToEncrypt, config.secretKey);

  return {
    data: encrypted,
    timestamp: getCurrentUnixTimestamp(),
    method: "multi-layer",
  };
}

/**
 * High-level decryption function
 * @param encryptionResult - Result from encryptDeviceData
 * @param config - Encryption configuration
 * @returns Promise<any>
 */
export async function decryptDeviceData(
  encryptionResult: EncryptionResult,
  config: EncryptionConfig
): Promise<any> {
  let decryptedData: string;

  if (encryptionResult.method === "multi-layer") {
    decryptedData = multiLayerDecrypt(encryptionResult.data, config.secretKey);
  } else if (encryptionResult.method === "xor-cipher") {
    decryptedData = xorDecipher(encryptionResult.data, config.secretKey);
  } else if (encryptionResult.method === "base64-obfuscated") {
    const salt = config.secretKey.split("").reverse().join("").substring(0, 8);
    decryptedData = base64Deobfuscate(encryptionResult.data, salt);
  } else {
    throw new Error("Unsupported encryption method");
  }

  // Check if data has timestamp structure
  try {
    const parsed = JSON.parse(decryptedData);

    if (parsed.timestamp && parsed.data) {
      // Check expiration
      if (parsed.expires && Date.now() > parsed.expires) {
        throw new Error("Encrypted data has expired");
      }

      // Return the actual data
      try {
        return JSON.parse(parsed.data);
      } catch {
        return parsed.data;
      }
    }

    return parsed;
  } catch {
    // Not JSON, return as string
    return decryptedData;
  }
}

/**
 * Utility để tạo secret key từ environment variables
 * @param baseKey - Base key string
 * @param environment - Environment ('development', 'production', etc.)
 * @returns Generated secret key
 */
export function generateSecretKey(
  baseKey: string,
  environment: string = "development"
): string {
  const combined = `${baseKey}-${environment}-${baseKey.split("").reverse().join("")}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to base64-like string
  const hashStr = Math.abs(hash).toString(36);
  return hashStr.padEnd(32, "0").substring(0, 32);
}

/**
 * Quick encrypt/decrypt functions for simple use cases
 */
export const quickEncrypt = {
  /**
   * Quick XOR encryption
   */
  xor: (data: string, key: string) => xorCipher(data, key),

  /**
   * Quick Base64 obfuscation
   */
  base64: (data: string, salt: string) => base64Obfuscate(data, salt),

  /**
   * Quick JSON encryption
   */
  json: (data: object, key: string) => xorCipher(JSON.stringify(data), key),

  /**
   * Multi-layer encryption
   */
  secure: (data: string, key: string) => multiLayerEncrypt(data, key),
};

export const quickDecrypt = {
  /**
   * Quick XOR decryption
   */
  xor: (data: string, key: string) => xorDecipher(data, key),

  /**
   * Quick Base64 deobfuscation
   */
  base64: (data: string, salt: string) => base64Deobfuscate(data, salt),

  /**
   * Quick JSON decryption
   */
  json: (data: string, key: string) => JSON.parse(xorDecipher(data, key)),

  /**
   * Multi-layer decryption
   */
  secure: (data: string, key: string) => multiLayerDecrypt(data, key),
};
