/**
 * @file Gom các routes cho API version 1.
 * @author Your Name
 */
import { Elysia } from "elysia";
import { v1Routes } from "./v1";

/**
 * Tất cả các routes cho API version 1
 */
export const appRoutes = new Elysia({
  prefix: "/api",
}).use(v1Routes);
