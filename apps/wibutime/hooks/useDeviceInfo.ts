"use client";

import { encryptDeviceData, generateSecretKey } from "@repo/utils";
import { useEffect, useState } from "react";

export interface DeviceInfo {
  // Screen Information
  screen: {
    width: number;
    height: number;
    availWidth: number;
    availHeight: number;
    innerWidth: number;
    innerHeight: number;
    devicePixelRatio: number;
    orientation: string;
    colorDepth: number;
    pixelDepth: number;
  };

  // Device Type
  device: {
    type: "mobile" | "tablet" | "desktop";
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    isTouchDevice: boolean;
    isRetina: boolean;
  };

  // Operating System
  os: {
    name: string;
    version: string;
    platform: string;
    architecture: string;
  };

  // Browser Information
  browser: {
    name: string;
    version: string;
    userAgent: string;
    language: string;
    languages: readonly string[];
    cookieEnabled: boolean;
    onLine: boolean;
  };

  // Hardware Capabilities
  hardware: {
    concurrency: number;
    memory?: number;
    maxTouchPoints: number;
    vibration: boolean;
  };

  // Network Information
  network?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
  };

  // IP Information
  ip?: {
    public: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    isp?: string;
    org?: string;
    as?: string;
    query?: string;
  };

  // Battery Information
  battery?: {
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
    level: number;
  };

  // Geolocation
  geolocation?: {
    supported: boolean;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  };

  // Additional Features
  features: {
    webGL: boolean;
    webGL2: boolean;
    canvas: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    webWorkers: boolean;
    serviceWorkers: boolean;
    notifications: boolean;
    camera: boolean;
    microphone: boolean;
  };
}

// Helper functions
const getDeviceType = (width: number): "mobile" | "tablet" | "desktop" => {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

const getOSInfo = (userAgent: string) => {
  const os = {
    name: "Unknown",
    version: "Unknown",
    platform: "",
    architecture: "",
  };

  if (typeof navigator !== "undefined") {
    os.platform = navigator.platform;

    // @ts-ignore - userAgentData might not be available
    if (navigator.userAgentData) {
      // @ts-ignore
      os.platform = navigator.userAgentData.platform;
    }
  }

  // Detect OS
  if (userAgent.includes("Windows NT")) {
    os.name = "Windows";
    const match = userAgent.match(/Windows NT ([\d.]+)/);
    if (match && match[1]) os.version = match[1];
  } else if (userAgent.includes("Mac OS X")) {
    os.name = "macOS";
    const match = userAgent.match(/Mac OS X ([\d_]+)/);
    if (match && match[1]) os.version = match[1].replace(/_/g, ".");
  } else if (userAgent.includes("Linux")) {
    os.name = "Linux";
  } else if (userAgent.includes("Android")) {
    os.name = "Android";
    const match = userAgent.match(/Android ([\d.]+)/);
    if (match && match[1]) os.version = match[1];
  } else if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
    os.name = "iOS";
    const match = userAgent.match(/OS ([\d_]+)/);
    if (match && match[1]) os.version = match[1].replace(/_/g, ".");
  }

  return os;
};

const getBrowserInfo = (userAgent: string) => {
  const browser = { name: "Unknown", version: "Unknown" };

  if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) {
    browser.name = "Chrome";
    const match = userAgent.match(/Chrome\/([\d.]+)/);
    if (match && match[1]) browser.version = match[1];
  } else if (userAgent.includes("Firefox")) {
    browser.name = "Firefox";
    const match = userAgent.match(/Firefox\/([\d.]+)/);
    if (match && match[1]) browser.version = match[1];
  } else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) {
    browser.name = "Safari";
    const match = userAgent.match(/Version\/([\d.]+)/);
    if (match && match[1]) browser.version = match[1];
  } else if (userAgent.includes("Edg")) {
    browser.name = "Edge";
    const match = userAgent.match(/Edg\/([\d.]+)/);
    if (match && match[1]) browser.version = match[1];
  }

  return browser;
};

const checkFeatureSupport = () => {
  const features = {
    webGL: false,
    webGL2: false,
    canvas: false,
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    webWorkers: false,
    serviceWorkers: false,
    notifications: false,
    camera: false,
    microphone: false,
  };

  try {
    // Canvas support
    const canvas = document.createElement("canvas");
    features.canvas = !!(canvas.getContext && canvas.getContext("2d"));

    // WebGL support
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    features.webGL = !!gl;

    // WebGL2 support
    const gl2 = canvas.getContext("webgl2");
    features.webGL2 = !!gl2;

    // Storage support
    features.localStorage =
      typeof Storage !== "undefined" && !!window.localStorage;
    features.sessionStorage =
      typeof Storage !== "undefined" && !!window.sessionStorage;
    features.indexedDB = !!window.indexedDB;

    // Worker support
    features.webWorkers = typeof Worker !== "undefined";
    features.serviceWorkers = "serviceWorker" in navigator;

    // Notification support
    features.notifications = "Notification" in window;

    // Media support
    features.camera = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    features.microphone = features.camera;
  } catch (error) {
    console.warn("Error checking feature support:", error);
  }

  return features;
};

/**
 * Lấy thông tin IP public từ các API miễn phí
 * @returns Promise<object | null> - Thông tin IP hoặc null nếu có lỗi
 */
const getPublicIPInfo = async (): Promise<any> => {
  // Danh sách các API backup (theo thứ tự ưu tiên)
  const ipApis = [
    {
      url: "http://ip-api.com/json",
      transform: (data: any) => ({
        public: data.query,
        country: data.country,
        region: data.regionName,
        city: data.city,
        timezone: data.timezone,
        isp: data.isp,
        org: data.org,
        as: data.as,
        query: data.query,
      }),
    },
    {
      url: "https://api.ipify.org?format=json",
      transform: (data: any) => ({
        public: data.ip,
        query: data.ip,
      }),
    },
  ];

  for (const api of ipApis) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(api.url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return api.transform(data);
      }
    } catch (error) {
      console.warn(`Failed to fetch IP from ${api.url}:`, error);
      continue; // Thử API tiếp theo
    }
  }

  console.warn("All IP API services failed");
  return null;
};

/**
 * Tạo device fingerprint từ thông tin thiết bị
 * @param deviceInfo - Thông tin thiết bị từ useDeviceInfo hook
 * @returns string - Device fingerprint hash
 */
export const generateDeviceFingerprint = (deviceInfo: DeviceInfo): string => {
  // Lấy các thông tin ổn định và unique
  const fingerprintData = {
    // Screen & Display (highly unique)
    screenWidth: deviceInfo.screen.width,
    screenHeight: deviceInfo.screen.height,
    colorDepth: deviceInfo.screen.colorDepth,
    pixelDepth: deviceInfo.screen.pixelDepth,
    devicePixelRatio: deviceInfo.screen.devicePixelRatio,

    // Hardware (very unique)
    concurrency: deviceInfo.hardware.concurrency,
    memory: deviceInfo.hardware.memory || 0,
    maxTouchPoints: deviceInfo.hardware.maxTouchPoints,
    vibration: deviceInfo.hardware.vibration,

    // OS & Platform (stable)
    osName: deviceInfo.os.name,
    osVersion: deviceInfo.os.version,
    platform: deviceInfo.os.platform,

    // Browser (stable)
    browserName: deviceInfo.browser.name,
    browserVersion: deviceInfo.browser.version,
    language: deviceInfo.browser.language,
    languages: deviceInfo.browser.languages.join(","),
    cookieEnabled: deviceInfo.browser.cookieEnabled,

    // IP Information (optional - for enhanced security)
    publicIP: deviceInfo.ip?.public || "",
    country: deviceInfo.ip?.country || "",

    // Web Features (very unique)
    webGL: deviceInfo.features.webGL,
    webGL2: deviceInfo.features.webGL2,
    canvas: deviceInfo.features.canvas,
    localStorage: deviceInfo.features.localStorage,
    sessionStorage: deviceInfo.features.sessionStorage,
    indexedDB: deviceInfo.features.indexedDB,
    webWorkers: deviceInfo.features.webWorkers,
    serviceWorkers: deviceInfo.features.serviceWorkers,
    notifications: deviceInfo.features.notifications,
    camera: deviceInfo.features.camera,
    microphone: deviceInfo.features.microphone,
  };

  // Tạo string từ object
  const fingerprintString = JSON.stringify(
    fingerprintData,
    Object.keys(fingerprintData).sort()
  );

  // Tạo hash đơn giản (có thể thay bằng crypto hash như SHA-256)
  return btoa(fingerprintString).replace(/[+/=]/g, "").substring(0, 32);
};

/**
 * Tạo device fingerprint với WebGL context info (chi tiết hơn)
 * @param deviceInfo - Thông tin thiết bị
 * @returns string - Enhanced device fingerprint
 */
export const generateEnhancedFingerprint = (deviceInfo: DeviceInfo): string => {
  const basicFingerprint = generateDeviceFingerprint(deviceInfo);

  // Thêm WebGL context info nếu có
  let webglInfo = "";
  try {
    if (deviceInfo.features.webGL) {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (gl && "getParameter" in gl) {
        const webglContext = gl as WebGLRenderingContext;
        const renderer = webglContext.getParameter(webglContext.RENDERER);
        const vendor = webglContext.getParameter(webglContext.VENDOR);
        const version = webglContext.getParameter(webglContext.VERSION);
        const shadingLanguageVersion = webglContext.getParameter(
          webglContext.SHADING_LANGUAGE_VERSION
        );

        webglInfo = `${renderer}|${vendor}|${version}|${shadingLanguageVersion}`;
      }
    }
  } catch (error) {
    // WebGL info không available
  }

  // Canvas fingerprinting
  let canvasFingerprint = "";
  try {
    if (deviceInfo.features.canvas) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = 200;
        canvas.height = 50;

        ctx.textBaseline = "top";
        ctx.font = '14px "Arial"';
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Device fingerprint 🔍", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Device fingerprint 🔍", 4, 17);

        canvasFingerprint = canvas.toDataURL().slice(-50);
      }
    }
  } catch (error) {
    // Canvas fingerprinting không available
  }

  const enhancedData =
    basicFingerprint + "|" + webglInfo + "|" + canvasFingerprint;
  return btoa(enhancedData).replace(/[+/=]/g, "").substring(0, 64);
};

/**
 * Strategy cho hybrid device fingerprinting
 */
export interface FingerprintStrategy {
  client: {
    basic: string; // Basic fingerprint cho immediate use
    enhanced: string; // Enhanced fingerprint với WebGL/Canvas
    timestamp: number; // Thời gian tạo
  };
  server?: {
    fingerprint: string; // Server-generated fingerprint
    confidence: number; // Độ tin cậy (0-1)
    additional: any; // Thông tin bổ sung từ server
  };
}

/**
 * Tạo fingerprint data để gửi lên server
 * @param deviceInfo - Device information
 * @returns object chứa data cần thiết cho server
 */
export const prepareServerFingerprintData = (deviceInfo: DeviceInfo) => {
  return {
    // Core device info (stable & unique)
    device: {
      screenWidth: deviceInfo.screen.width,
      screenHeight: deviceInfo.screen.height,
      colorDepth: deviceInfo.screen.colorDepth,
      devicePixelRatio: deviceInfo.screen.devicePixelRatio,
      concurrency: deviceInfo.hardware.concurrency,
      memory: deviceInfo.hardware.memory,
      maxTouchPoints: deviceInfo.hardware.maxTouchPoints,
      platform: deviceInfo.os.platform,
      language: deviceInfo.browser.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },

    // IP Information (for location and security)
    ip: deviceInfo.ip
      ? {
          public: deviceInfo.ip.public,
          country: deviceInfo.ip.country,
          region: deviceInfo.ip.region,
          city: deviceInfo.ip.city,
          timezone: deviceInfo.ip.timezone,
          isp: deviceInfo.ip.isp,
        }
      : null,

    // Features (for validation)
    features: {
      webGL: deviceInfo.features.webGL,
      canvas: deviceInfo.features.canvas,
      localStorage: deviceInfo.features.localStorage,
      touchDevice: deviceInfo.device.isTouchDevice,
    },

    // Client-generated fingerprints (for comparison)
    clientFingerprints: {
      basic: generateDeviceFingerprint(deviceInfo),
      enhanced: generateEnhancedFingerprint(deviceInfo),
    },

    // Metadata
    timestamp: Date.now(),
    userAgent: deviceInfo.browser.userAgent,
  };
};

/**
 * Tạo encrypted fingerprint data để gửi lên server một cách an toàn
 * @param deviceInfo - Device information
 * @param secretKey - Secret key for encryption
 * @returns Promise<object> - Encrypted data ready to send to server
 */
export const prepareEncryptedFingerprintData = async (
  deviceInfo: DeviceInfo,
  secretKey: string
) => {
  // Tạo secret key từ base key và environment
  const environment = process.env.NODE_ENV || "development";
  const finalSecretKey = generateSecretKey(secretKey, environment);

  // Prepare basic data
  const basicData = prepareServerFingerprintData(deviceInfo);

  // Encrypt sensitive data
  const encryptedResult = await encryptDeviceData(basicData, {
    secretKey: finalSecretKey,
    useTimestamp: true,
    expirationMinutes: 60, // 1 hour expiration
  });

  return {
    // Public metadata (không sensitive)
    meta: {
      timestamp: encryptedResult.timestamp,
      method: encryptedResult.method,
      version: "1.0.0",
    },

    // Encrypted payload
    payload: encryptedResult.data,

    // Optional: Include non-sensitive info for server-side validation
    hints: {
      deviceType: deviceInfo.device.type,
      hasIP: !!deviceInfo.ip,
      browserName: deviceInfo.browser.name,
      platform: deviceInfo.os.name,
    },
  };
};

/**
 * Hook cho hybrid fingerprinting strategy
 */
export const useHybridFingerprint = () => {
  const deviceInfo = useDeviceInfo();
  const [strategy, setStrategy] = useState<FingerprintStrategy>({
    client: {
      basic: "",
      enhanced: "",
      timestamp: 0,
    },
  });

  // Tạo client-side fingerprint ngay lập tức
  useEffect(() => {
    if (deviceInfo.browser.userAgent) {
      const basic = generateDeviceFingerprint(deviceInfo);
      const enhanced = generateEnhancedFingerprint(deviceInfo);

      setStrategy((prev) => ({
        ...prev,
        client: {
          basic,
          enhanced,
          timestamp: Date.now(),
        },
      }));
    }
  }, [deviceInfo]);

  // Function để gửi data lên server và nhận server fingerprint
  const syncWithServer = async (apiEndpoint: string) => {
    try {
      const serverData = prepareServerFingerprintData(deviceInfo);

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverData),
      });

      if (response.ok) {
        const serverResult = await response.json();

        setStrategy((prev) => ({
          ...prev,
          server: {
            fingerprint: serverResult.fingerprint,
            confidence: serverResult.confidence || 1,
            additional: serverResult.additional || {},
          },
        }));

        return serverResult;
      }
    } catch (error) {
      console.warn("Server fingerprinting failed:", error);
    }

    return null;
  };

  return {
    strategy,
    deviceInfo,

    // Client fingerprints (available immediately)
    clientFingerprint: strategy.client.basic,
    enhancedFingerprint: strategy.client.enhanced,

    // Server sync
    syncWithServer,
    prepareServerData: () => prepareServerFingerprintData(deviceInfo),

    // Best fingerprint (prefer server if available)
    getBestFingerprint: () => {
      return (
        strategy.server?.fingerprint ||
        strategy.client.enhanced ||
        strategy.client.basic
      );
    },

    // Validation helpers
    isConsistent: () => {
      if (!strategy.server) return true;

      // So sánh client vs server fingerprints
      const clientHash = strategy.client.basic;
      const serverHash = strategy.server.fingerprint;

      // Simple similarity check (có thể improve)
      return clientHash === serverHash || strategy.server.confidence > 0.8;
    },
  };
};

/**
 * Hook để tự động tạo device fingerprint (backward compatibility)
 * @returns object chứa deviceInfo và fingerprint
 */
export const useDeviceFingerprint = () => {
  const deviceInfo = useDeviceInfo();
  const [fingerprint, setFingerprint] = useState<string>("");
  const [enhancedFingerprint, setEnhancedFingerprint] = useState<string>("");

  useEffect(() => {
    // Đợi deviceInfo load xong
    if (deviceInfo.browser.userAgent) {
      const basic = generateDeviceFingerprint(deviceInfo);
      const enhanced = generateEnhancedFingerprint(deviceInfo);

      setFingerprint(basic);
      setEnhancedFingerprint(enhanced);
    }
  }, [deviceInfo]);

  return {
    deviceInfo,
    fingerprint,
    enhancedFingerprint,
    // Utility functions
    generateFingerprint: () => generateDeviceFingerprint(deviceInfo),
    generateEnhancedFingerprint: () => generateEnhancedFingerprint(deviceInfo),
  };
};

/**
 * Hook chỉ để lấy thông tin IP (lightweight)
 * @returns object chứa IP information và loading state
 */
export const useIPInfo = () => {
  const [ipInfo, setIPInfo] = useState<DeviceInfo["ip"] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIPInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const info = await getPublicIPInfo();
      setIPInfo(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch IP info");
      setIPInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIPInfo();
  }, []);

  return {
    ipInfo,
    loading,
    error,
    refetch: fetchIPInfo,
  };
};

export const useDeviceInfo = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    screen: {
      width: 0,
      height: 0,
      availWidth: 0,
      availHeight: 0,
      innerWidth: 0,
      innerHeight: 0,
      devicePixelRatio: 1,
      orientation: "portrait",
      colorDepth: 24,
      pixelDepth: 24,
    },
    device: {
      type: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isTouchDevice: false,
      isRetina: false,
    },
    os: {
      name: "Unknown",
      version: "Unknown",
      platform: "",
      architecture: "",
    },
    browser: {
      name: "Unknown",
      version: "Unknown",
      userAgent: "",
      language: "en",
      languages: [],
      cookieEnabled: false,
      onLine: true,
    },
    hardware: {
      concurrency: 1,
      maxTouchPoints: 0,
      vibration: false,
    },
    features: {
      webGL: false,
      webGL2: false,
      canvas: false,
      localStorage: false,
      sessionStorage: false,
      indexedDB: false,
      webWorkers: false,
      serviceWorkers: false,
      notifications: false,
      camera: false,
      microphone: false,
    },
  });

  const updateDeviceInfo = async () => {
    try {
      const userAgent = navigator.userAgent;
      const screenWidth = window.innerWidth;
      const deviceType = getDeviceType(screenWidth);
      const osInfo = getOSInfo(userAgent);
      const browserInfo = getBrowserInfo(userAgent);
      const features = checkFeatureSupport();

      const newDeviceInfo: DeviceInfo = {
        screen: {
          width: screen.width,
          height: screen.height,
          availWidth: screen.availWidth,
          availHeight: screen.availHeight,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio || 1,
          orientation:
            window.innerHeight > window.innerWidth ? "portrait" : "landscape",
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
        },
        device: {
          type: deviceType,
          isMobile: deviceType === "mobile",
          isTablet: deviceType === "tablet",
          isDesktop: deviceType === "desktop",
          isTouchDevice:
            "ontouchstart" in window || navigator.maxTouchPoints > 0,
          isRetina: window.devicePixelRatio > 1,
        },
        os: osInfo,
        browser: {
          ...browserInfo,
          userAgent,
          language: navigator.language,
          languages: navigator.languages,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
        },
        hardware: {
          concurrency: navigator.hardwareConcurrency || 1,
          memory: (navigator as any).deviceMemory,
          maxTouchPoints: navigator.maxTouchPoints || 0,
          vibration: "vibrate" in navigator,
        },
        features,
      };

      // Network Information
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;
      if (connection) {
        newDeviceInfo.network = {
          effectiveType: connection.effectiveType || "unknown",
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
        };
      }

      // Battery Information
      try {
        const battery = await (navigator as any).getBattery?.();
        if (battery) {
          newDeviceInfo.battery = {
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            level: battery.level,
          };
        }
      } catch (error) {
        // Battery API not supported
      }

      // Geolocation
      if (navigator.geolocation) {
        newDeviceInfo.geolocation = { supported: true };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setDeviceInfo((prev) => ({
              ...prev,
              geolocation: {
                supported: true,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              },
            }));
          },
          (error) => {
            console.warn("Geolocation error:", error);
          },
          { timeout: 5000, enableHighAccuracy: false }
        );
      }

      setDeviceInfo(newDeviceInfo);
    } catch (error) {
      console.error("Error getting device info:", error);
    }
  };

  const updateIPInfo = async () => {
    try {
      const ipInfo = await getPublicIPInfo();
      if (ipInfo) {
        setDeviceInfo((prev) => ({
          ...prev,
          ip: ipInfo,
        }));
      }
    } catch (error) {
      console.warn("Error getting IP info:", error);
    }
  };

  useEffect(() => {
    updateDeviceInfo();

    // Lấy thông tin IP (không đồng bộ)
    updateIPInfo();

    const handleResize = () => {
      setDeviceInfo((prev) => ({
        ...prev,
        screen: {
          ...prev.screen,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          orientation:
            window.innerHeight > window.innerWidth ? "portrait" : "landscape",
        },
        device: {
          ...prev.device,
          type: getDeviceType(window.innerWidth),
          isMobile: getDeviceType(window.innerWidth) === "mobile",
          isTablet: getDeviceType(window.innerWidth) === "tablet",
          isDesktop: getDeviceType(window.innerWidth) === "desktop",
        },
      }));
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        handleResize();
      }, 100);
    };

    const handleOnlineStatusChange = () => {
      setDeviceInfo((prev) => ({
        ...prev,
        browser: {
          ...prev.browser,
          onLine: navigator.onLine,
        },
      }));
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("online", handleOnlineStatusChange);
    window.addEventListener("offline", handleOnlineStatusChange);

    // Network change listener
    const connection =
      (navigator as any).connection ??
      (navigator as any).mozConnection ??
      (navigator as any).webkitConnection;

    const handleNetworkChange = () => {
      if (connection) {
        setDeviceInfo((prev) => ({
          ...prev,
          network: {
            effectiveType: connection.effectiveType ?? "unknown",
            downlink: connection.downlink ?? 0,
            rtt: connection.rtt ?? 0,
            saveData: connection.saveData ?? false,
          },
        }));
      }
    };

    if (connection) {
      connection.addEventListener("change", handleNetworkChange);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("online", handleOnlineStatusChange);
      window.removeEventListener("offline", handleOnlineStatusChange);

      if (connection) {
        connection.removeEventListener("change", handleNetworkChange);
      }
    };
  }, []);

  return deviceInfo;
};
