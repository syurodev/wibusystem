/**
 * @file Gom các routes cho API version 1.
 * @author Your Name
 */
import { Elysia } from "elysia";
import { authRoutes } from "./auth/controllers/auth.controller";
import { sessionRoutes } from "./sessions/controllers/session.controller";
import { userRoutes } from "./users/controllers/user.controller";

/**
 * Tất cả các routes cho API version 1
 */
export const v1Routes = new Elysia({
  prefix: "/api/v1",
})
  .use(authRoutes)
  .use(userRoutes)
  .use(sessionRoutes);
