"use client";
import { registerDevice } from "@/actions/auth/device-register";
import { useDeviceFingerprint } from "@/hooks/useDeviceInfo";
import { useEffect, useState } from "react";

const AuthPage = () => {
  const {
    fingerprint, // Basic fingerprint (32 chars)
    enhancedFingerprint, // Enhanced với WebGL + Canvas (64 chars)
    deviceInfo,
  } = useDeviceFingerprint();

  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  console.log("Device ID:", fingerprint);
  console.log("Enhanced ID:", enhancedFingerprint);
  console.log("deviceInfo:", deviceInfo);

  const handleRegisterDevice = async () => {
    if (isRegistering || !deviceInfo.browser.userAgent) return; // Prevent multiple calls và wait for deviceInfo

    try {
      setIsRegistering(true);
      setRegistrationStatus("loading");

      const response = await registerDevice(deviceInfo);

      setRegistrationStatus("success");
    } catch (error) {
      setRegistrationStatus("error");
    } finally {
      setIsRegistering(false);
    }
  };

  // Auto-register when deviceInfo is ready
  useEffect(() => {
    if (deviceInfo.browser.userAgent && registrationStatus === "idle") {
      handleRegisterDevice();
    }
  }, [deviceInfo.browser.userAgent, registrationStatus]); // Only run when deviceInfo is loaded

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Device Authentication</h1>

      <div className="space-y-4">
        <div>
          <span className="font-semibold">Registration Status: </span>
          <span
            className={`px-2 py-1 rounded text-sm ${
              registrationStatus === "loading"
                ? "bg-blue-100 text-blue-800"
                : registrationStatus === "success"
                  ? "bg-green-100 text-green-800"
                  : registrationStatus === "error"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {registrationStatus === "loading"
              ? "Registering..."
              : registrationStatus === "success"
                ? "Registered"
                : registrationStatus === "error"
                  ? "Failed"
                  : "Waiting for device info..."}
          </span>
        </div>

        <div>
          <span className="font-semibold">Device Type: </span>
          {deviceInfo.device.type}
        </div>

        <div>
          <span className="font-semibold">Basic Fingerprint: </span>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {fingerprint || "Generating..."}
          </code>
        </div>

        <div>
          <span className="font-semibold">Enhanced Fingerprint: </span>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
            {enhancedFingerprint || "Generating..."}
          </code>
        </div>

        {deviceInfo.ip && (
          <div>
            <span className="font-semibold">Location: </span>
            {deviceInfo.ip.city}, {deviceInfo.ip.country} (IP:{" "}
            {deviceInfo.ip.public})
          </div>
        )}

        <button
          onClick={handleRegisterDevice}
          disabled={isRegistering || !deviceInfo.browser.userAgent}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isRegistering ? "Registering..." : "Register Device"}
        </button>
      </div>
    </div>
  );
};

export default AuthPage;
