import { Elysia } from "elysia";
import { apiRoutesV1 } from "./v1";

/**
 * Tất cả các routes cho API v1
 */
export const apiRoutes = new Elysia({
  name: "apiRoutes",
  prefix: "/api",
}).use(apiRoutesV1);
