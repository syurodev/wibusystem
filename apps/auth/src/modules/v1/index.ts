import { Elysia } from "elysia";
import { authController } from "./auth";

/**
 * Tất cả các routes cho API v1
 */
export const apiRoutesV1 = new Elysia({
  name: "apiRoutesV1",
  prefix: "/v1",
}).use(authController);
