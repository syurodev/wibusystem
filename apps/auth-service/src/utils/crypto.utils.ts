/**
 * Generate a secure random token using Bun's crypto capabilities
 */
export function generateSecureToken(): string {
  // Sử dụng crypto.getRandomValues với Uint8Array
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

/**
 * Validate if a string is a valid UUID v4
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate device fingerprint using Bun.CryptoHasher
 */
// export function generateDeviceFingerprint(
//   request: DeviceRegistrationRequest
// ): string {
//   const data = `${request.device_fingerprint.user_agent}|${request.device_fingerprint.ip_address}|${request.device_fingerprint.device_type || ""}`;

//   const hasher = new Bun.CryptoHasher("sha256");
//   hasher.update(data);
//   return hasher.digest("hex");
// }

/**
 * Hash a string using Bun.CryptoHasher with SHA-256
 */
export function hashString(input: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(input);
  return hasher.digest("hex");
}

/**
 * Generate HMAC using Bun.CryptoHasher
 */
export function generateHMAC(data: string, secret: string): string {
  const hasher = new Bun.CryptoHasher("sha256", secret);
  hasher.update(data);
  return hasher.digest("hex");
}

/**
 * Generate JWT-like token using Bun hashing (improved version)
 */
export function generateJWTToken(
  payload: Record<string, any>,
  secret?: string
): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString(
    "base64url"
  );
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );

  // Sử dụng HMAC với secret hoặc simple hash
  let signature: string;
  if (secret) {
    signature = generateHMAC(`${encodedHeader}.${encodedPayload}`, secret);
  } else {
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(`${encodedHeader}.${encodedPayload}`);
    signature = hasher.digest("base64url");
  }

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Generate fast non-cryptographic hash using Bun.hash (for quick comparisons)
 */
export function generateFastHash(input: string): string {
  return Bun.hash(input).toString(16);
}

/**
 * Generate secure random string with specific length
 */
export function generateRandomString(length: number): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, length);
}

/**
 * Hash password using Bun.password (for future password features)
 */
export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: "argon2id",
    memoryCost: 65536, // 64MB
    timeCost: 3,
  });
}

/**
 * Verify password using Bun.password
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await Bun.password.verify(password, hash);
}

/**
 * Generate device ID using crypto.randomUUID (Bun compatible)
 */
export function generateDeviceUUID(): string {
  return crypto.randomUUID();
}
