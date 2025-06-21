"use server";

import { DeviceInfo } from "@/hooks/useDeviceInfo";
import { SERVICE_ID } from "@repo/types";
import {
  AuthApiConfig,
  encryptDeviceData,
  generateSecretKey,
} from "@repo/utils";

export const registerDevice = async (deviceInfo: DeviceInfo) => {
  const registerDeviceApi = AuthApiConfig.getDeviceRegisterUrl();

  const secretKey = generateSecretKey(
    process.env.DATA_ENCRYPT_SECRET_KEY ?? "",
    process.env.NODE_ENV ?? "development"
  );

  const encryptedResult = await encryptDeviceData(deviceInfo, {
    secretKey,
    useTimestamp: true,
    expirationMinutes: 60, // 1 hour
  });
  console.log(
    "`${process.env.PUBLIC_API_URL}/${registerDeviceApi.url}`",
    `${process.env.PUBLIC_API_URL}${registerDeviceApi.url}`
  );

  const response = await fetch(
    `${process.env.PUBLIC_API_URL}${registerDeviceApi.url}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-project-id": SERVICE_ID.AUTH,
        "x-api-id": registerDeviceApi.apiId,
      },
      body: JSON.stringify({
        deviceInfo: JSON.stringify(encryptedResult),
      }),
    }
  );

  const data = await response.json();
  console.log("data:", data);
};
