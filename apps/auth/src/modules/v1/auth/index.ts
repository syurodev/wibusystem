import { AuthApiConfig } from "@repo/utils";
import { Elysia } from "elysia";

import { AuthDto } from "./auth.dto";
import { AuthResponse } from "./auth.response";
import { AuthService } from "./auth.service";

export const authController = new Elysia({
  prefix: "/auth",
})
  .decorate("authService", new AuthService())
  .decorate("requestIP", ({ request }: { request: any }) => {
    return (
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown"
    );
  })
  .model({
    "body.auth.register": AuthDto.registerAccountSchema,
    "response.auth.register": AuthResponse.registerDataSchema,
    "body.auth.device": AuthDto.deviceFingerprintSchema,
    "response.auth.deviceToken": AuthResponse.deviceTokenSchema,
    "response.auth.deviceVerification": AuthResponse.deviceVerificationSchema,
    "body.auth.deviceLink": AuthDto.deviceLinkSchema,
  })
  .post(
    AuthApiConfig.ROUTES["POST /register"].path,
    ({ body, authService }) => {
      return {
        id: 10,
        email: "test@test.com",
      };
    },
    {
      body: "body.auth.register",
      response: "response.auth.register",
      detail: {
        summary: "Register a new account",
        description: "Register a new account",
        tags: ["Auth"],
      },
    }
  )
  .post(
    AuthApiConfig.ROUTES["POST /device/token"].path,
    async ({ body, authService, request, requestIP }) => {
      console.log(requestIP({ request }));
      const result = await authService.createDeviceToken(
        body,
        requestIP({ request })
      );
      return result;
    },
    {
      body: "body.auth.device",
      response: "response.auth.deviceToken",
      detail: {
        summary: "Create device token for guest user",
        description:
          "Generate a device token based on device fingerprint for users who haven't logged in yet",
        tags: ["Auth", "Device"],
      },
    }
  )
  .post(
    AuthApiConfig.ROUTES["POST /device/verify"].path,
    async ({ body, authService, headers, set }) => {
      const deviceToken = headers.authorization?.replace("Bearer ", "");

      const result = await authService.verifyDevice(body, deviceToken);
      return result;
    },
    {
      body: "body.auth.device",
      response: "response.auth.deviceVerification",
      detail: {
        summary: "Verify device fingerprint",
        description:
          "Verify if a device is recognized and get device information",
        tags: ["Auth", "Device"],
      },
    }
  )
  .post(
    AuthApiConfig.ROUTES["POST /device/link"].path,
    async ({ authService, headers, body, set }) => {
      try {
        const deviceToken = headers.authorization?.replace("Bearer ", "");

        if (!deviceToken) {
          set.status = 400;
          return { error: "Device token required" };
        }

        const success = await authService.linkDeviceToUser(
          body.user_id,
          deviceToken,
          body.access_token,
          body.refresh_token
        );

        if (success) {
          return { message: "Device linked successfully" };
        } else {
          set.status = 400;
          return { error: "Failed to link device" };
        }
      } catch (error) {
        set.status = 500;
        return {
          error: "Failed to link device",
          message: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      body: "body.auth.deviceLink",
      detail: {
        summary: "Link device to user account",
        description:
          "Associate an existing device token with a user account after login",
        tags: ["Auth", "Device"],
      },
    }
  );
