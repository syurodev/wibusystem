export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  type?: string;
  version?: string;
}

export interface RiskCalculationParams {
  duplicateCount: number;
  deviceInfo: DeviceInfo;
  ipAddress: string;
}

/**
 * Extract device information from User-Agent string
 */
export function extractDeviceInfo(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  // Browser detection
  let browser = "unknown";
  if (ua.includes("chrome") && !ua.includes("edge")) browser = "chrome";
  else if (ua.includes("firefox")) browser = "firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "safari";
  else if (ua.includes("edge")) browser = "edge";

  // OS detection
  let os = "unknown";
  if (ua.includes("windows")) os = "windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macos";
  else if (ua.includes("linux")) os = "linux";
  else if (ua.includes("android")) os = "android";
  else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad"))
    os = "ios";

  // Device type detection
  let type = "desktop";
  if (ua.includes("mobile") || ua.includes("android")) type = "mobile";
  else if (ua.includes("tablet") || ua.includes("ipad")) type = "tablet";

  // Device name detection
  let device = "unknown";
  if (ua.includes("iphone")) device = "iPhone";
  else if (ua.includes("ipad")) device = "iPad";
  else if (ua.includes("android")) device = "Android Device";
  else if (ua.includes("windows")) device = "Windows PC";
  else if (ua.includes("macintosh")) device = "Mac";

  return {
    browser,
    os,
    device,
    type,
    version: extractBrowserVersion(userAgent, browser),
  };
}

/**
 * Extract browser version from User-Agent
 */
function extractBrowserVersion(userAgent: string, browser: string): string {
  const patterns: Record<string, RegExp> = {
    chrome: /chrome\/([0-9.]+)/i,
    firefox: /firefox\/([0-9.]+)/i,
    safari: /version\/([0-9.]+).*safari/i,
    edge: /edge\/([0-9.]+)/i,
  };

  const pattern = patterns[browser];
  if (!pattern) return "unknown";

  const match = userAgent.match(pattern);
  return match ? match[1] : "unknown";
}

/**
 * Validate device information
 */
export function validateDeviceInfo(deviceInfo: DeviceInfo): boolean {
  // Basic validation - reject obviously fake or suspicious user agents
  if (!deviceInfo.browser || deviceInfo.browser === "unknown") return false;
  if (!deviceInfo.os || deviceInfo.os === "unknown") return false;
  if (!deviceInfo.type || deviceInfo.type === "unknown") return false;

  return true;
}

/**
 * Calculate risk score based on various factors
 */
export function calculateRiskScore(params: RiskCalculationParams): number {
  let score = 0;

  // Duplicate devices from same fingerprint
  score += params.duplicateCount * 20;

  // Suspicious user agent patterns
  if (params.deviceInfo.browser === "unknown") score += 30;
  if (params.deviceInfo.os === "unknown") score += 30;
  if (params.deviceInfo.device === "unknown") score += 20;

  // IP address patterns (basic checks)
  if (isPrivateIP(params.ipAddress)) score += 10;
  if (isLocalhostIP(params.ipAddress)) score += 5;

  // Common suspicious patterns
  if (
    params.deviceInfo.browser === "curl" ||
    params.deviceInfo.browser === "wget" ||
    params.deviceInfo.browser === "postman"
  ) {
    score += 50;
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Check if IP is private range
 */
function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
  ];

  return privateRanges.some((range) => range.test(ip));
}

/**
 * Check if IP is localhost
 */
function isLocalhostIP(ip: string): boolean {
  return ip === "127.0.0.1" || ip === "::1" || ip === "localhost";
}

/**
 * Generate device name from device info
 */
export function generateDeviceName(deviceInfo: DeviceInfo): string {
  const parts = [];

  if (deviceInfo.device && deviceInfo.device !== "unknown") {
    parts.push(deviceInfo.device);
  }

  if (deviceInfo.browser && deviceInfo.browser !== "unknown") {
    parts.push(deviceInfo.browser);
  }

  if (deviceInfo.os && deviceInfo.os !== "unknown") {
    parts.push(deviceInfo.os);
  }

  return parts.length > 0 ? parts.join(" - ") : "Unknown Device";
}
