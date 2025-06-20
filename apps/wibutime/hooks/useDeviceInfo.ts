"use client";

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
 * Hook để tự động tạo device fingerprint
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

  useEffect(() => {
    updateDeviceInfo();

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
