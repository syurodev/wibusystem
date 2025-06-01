/**
 * EXAMPLE: Client-side implementation cho Device Registration
 *
 * Đây là ví dụ code để client (web, mobile) implement device registration
 * Updated to use Bun-compatible APIs
 */

// 1. Tạo UUID cho device sử dụng Bun-compatible methods
function generateDeviceId(): string {
  // Sử dụng crypto.randomUUID() (available in modern browsers và Bun)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback sử dụng crypto.getRandomValues() cho browsers cũ
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40;
    array[8] = (array[8] & 0x3f) | 0x80;

    const hex = Array.from(array, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");
    return [
      hex.substring(0, 8),
      hex.substring(8, 12),
      hex.substring(12, 16),
      hex.substring(16, 20),
      hex.substring(20, 32),
    ].join("-");
  }

  // Final fallback cho environments không có crypto
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 2. Enhanced storage functions với error handling
class DeviceStorage {
  private static DEVICE_ID_KEY = "wibus_device_id";
  private static DEVICE_TOKEN_KEY = "wibus_device_token";
  private static DEVICE_EXPIRES_KEY = "wibus_device_expires";
  private static DEVICE_FINGERPRINT_KEY = "wibus_device_fingerprint";

  static getDeviceId(): string {
    try {
      let deviceId = localStorage.getItem(this.DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(this.DEVICE_ID_KEY, deviceId);
        console.log("🆔 Generated new device ID:", deviceId);
      }
      return deviceId;
    } catch (error) {
      console.warn("❌ Cannot access localStorage, using session device ID");
      // Fallback to sessionStorage hoặc memory
      return generateDeviceId();
    }
  }

  static getDeviceToken(): string | null {
    try {
      const token = localStorage.getItem(this.DEVICE_TOKEN_KEY);
      const expires = localStorage.getItem(this.DEVICE_EXPIRES_KEY);

      if (!token || !expires) return null;

      // Check if expired
      if (Date.now() > parseInt(expires)) {
        this.clearDeviceToken();
        return null;
      }

      return token;
    } catch (error) {
      console.warn("❌ Cannot access device token from storage");
      return null;
    }
  }

  static setDeviceToken(token: string, expiresAt: number): void {
    try {
      localStorage.setItem(this.DEVICE_TOKEN_KEY, token);
      localStorage.setItem(this.DEVICE_EXPIRES_KEY, expiresAt.toString());
      console.log("💾 Device token saved, expires at:", new Date(expiresAt));
    } catch (error) {
      console.warn("❌ Cannot save device token to storage");
    }
  }

  static clearDeviceToken(): void {
    try {
      localStorage.removeItem(this.DEVICE_TOKEN_KEY);
      localStorage.removeItem(this.DEVICE_EXPIRES_KEY);
      console.log("🗑️ Device token cleared");
    } catch (error) {
      console.warn("❌ Cannot clear device token from storage");
    }
  }

  static generateFingerprint(): string {
    try {
      let fingerprint = localStorage.getItem(this.DEVICE_FINGERPRINT_KEY);
      if (!fingerprint) {
        // Tạo fingerprint dựa trên browser characteristics
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.textBaseline = "top";
          ctx.font = "14px Arial";
          ctx.fillText("Device fingerprint", 2, 2);
        }

        fingerprint = btoa(
          [
            navigator.userAgent,
            navigator.language,
            screen.width + "x" + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL(),
          ].join("|")
        ).substring(0, 32);

        localStorage.setItem(this.DEVICE_FINGERPRINT_KEY, fingerprint);
      }
      return fingerprint;
    } catch (error) {
      // Fallback fingerprint
      return btoa(navigator.userAgent).substring(0, 32);
    }
  }
}

// 3. Enhanced Device Registration Service
class DeviceAuthClient {
  private baseUrl: string;
  private retryAttempts: number;

  constructor(
    baseUrl: string = "http://localhost:3001",
    retryAttempts: number = 3
  ) {
    this.baseUrl = baseUrl;
    this.retryAttempts = retryAttempts;
  }

  /**
   * Đăng ký thiết bị với retry logic
   */
  async registerDevice(): Promise<{
    access_token: string;
    expires_at: number;
    permissions: string[];
    device_id: string;
  }> {
    const deviceId = DeviceStorage.getDeviceId();
    const deviceInfo = this.detectDeviceInfo();

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(
          `📱 Attempting device registration (${attempt}/${this.retryAttempts})...`
        );

        const response = await fetch(`${this.baseUrl}/device-auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_id: deviceId,
            device_name: deviceInfo.name,
            device_type: deviceInfo.type,
            location: await this.getLocation(),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || `Registration failed with status ${response.status}`
          );
        }

        const result = await response.json();

        // Lưu token vào storage
        DeviceStorage.setDeviceToken(
          result.data.access_token,
          result.data.expires_at
        );

        console.log(
          "✅ Device registered successfully:",
          result.data.device_id
        );
        return result.data;
      } catch (error) {
        console.warn(`❌ Registration attempt ${attempt} failed:`, error);

        if (attempt === this.retryAttempts) {
          throw new Error(
            `Device registration failed after ${this.retryAttempts} attempts: ${error}`
          );
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }

    throw new Error("Registration failed");
  }

  /**
   * Lấy device token với automatic registration
   */
  async getDeviceToken(): Promise<string> {
    let token = DeviceStorage.getDeviceToken();

    if (!token) {
      console.log("🔄 No valid token found, registering device...");
      const registration = await this.registerDevice();
      token = registration.access_token;
    }

    return token;
  }

  /**
   * Validate token với server
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/device-auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ access_token: token }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Token validation successful:", result.data);
        return true;
      } else {
        console.warn("❌ Token validation failed:", response.status);
        return false;
      }
    } catch (error) {
      console.warn("❌ Token validation error:", error);
      return false;
    }
  }

  /**
   * Enhanced device detection
   */
  private detectDeviceInfo() {
    const ua = navigator.userAgent;

    // Enhanced device type detection
    let type = "desktop";
    if (/Mobile|Android|iPhone/.test(ua)) type = "mobile";
    else if (/iPad|Tablet/.test(ua)) type = "tablet";

    // Enhanced device name detection
    let name = "Unknown Device";
    if (/iPhone/.test(ua)) {
      const iPhoneMatch = ua.match(/iPhone OS (\d+_\d+)/);
      name = `iPhone${iPhoneMatch ? ` (iOS ${iPhoneMatch[1].replace("_", ".")})` : ""}`;
    } else if (/iPad/.test(ua)) {
      name = "iPad";
    } else if (/Android/.test(ua)) {
      const androidMatch = ua.match(/Android (\d+\.\d+)/);
      name = `Android Device${androidMatch ? ` (${androidMatch[1]})` : ""}`;
    } else if (/Windows/.test(ua)) {
      name = "Windows PC";
    } else if (/Macintosh/.test(ua)) {
      name = "Mac";
    }

    return { type, name };
  }

  /**
   * Get location với timeout
   */
  private async getLocation(): Promise<string | undefined> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch("https://ipapi.co/json/", {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return `${data.city}, ${data.country_name}`;
      }
    } catch (error) {
      console.warn("🌍 Cannot get location:", error);
    }
    return undefined;
  }
}

// 4. Enhanced HTTP Client với better error handling
class ApiClient {
  private deviceAuth: DeviceAuthClient;
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:3000") {
    this.baseUrl = baseUrl;
    this.deviceAuth = new DeviceAuthClient();
  }

  /**
   * Make authenticated request với automatic token refresh
   */
  async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let token = await this.deviceAuth.getDeviceToken();

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    let response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    // Nếu token invalid, thử register lại
    if (response.status === 401) {
      console.log("🔄 Token expired, re-registering device...");
      DeviceStorage.clearDeviceToken();
      token = await this.deviceAuth.getDeviceToken();

      headers.Authorization = `Bearer ${token}`;
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });
    }

    return response;
  }

  /**
   * GET request với error handling
   */
  async get(endpoint: string): Promise<any> {
    try {
      const response = await this.request(endpoint);
      if (!response.ok) {
        throw new Error(`GET ${endpoint} failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ GET ${endpoint} error:`, error);
      throw error;
    }
  }

  /**
   * POST request với error handling
   */
  async post(endpoint: string, data: any): Promise<any> {
    try {
      const response = await this.request(endpoint, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`POST ${endpoint} failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ POST ${endpoint} error:`, error);
      throw error;
    }
  }
}

// 5. Enhanced example usage với better logging
export async function exampleUsage() {
  console.log("🚀 === DEVICE REGISTRATION EXAMPLE ===");

  try {
    // Initialize client
    const apiClient = new ApiClient("http://localhost:3000");

    // Example 1: Call protected API
    console.log("📡 1. Calling protected API...");
    const protectedData = await apiClient.get("/api/protected-content");
    console.log("✅ Protected data:", protectedData);

    // Example 2: Post anonymous feedback
    console.log("💬 2. Posting anonymous feedback...");
    const feedbackResponse = await apiClient.post("/api/feedback", {
      message: "This is anonymous feedback from device",
      rating: 5,
      timestamp: Date.now(),
    });
    console.log("✅ Feedback response:", feedbackResponse);

    // Example 3: Manual device registration test
    console.log("🔧 3. Testing manual device registration...");
    const deviceAuth = new DeviceAuthClient();
    const registration = await deviceAuth.registerDevice();
    console.log("✅ Device registered:", {
      device_id: registration.device_id,
      permissions: registration.permissions,
      expires_in:
        Math.round((registration.expires_at - Date.now()) / 1000 / 60 / 60) +
        " hours",
    });

    console.log("🎉 All examples completed successfully!");
  } catch (error) {
    console.error("💥 Example failed:", error);
  }
}

// Export classes for use
export { ApiClient, DeviceAuthClient, DeviceStorage };
