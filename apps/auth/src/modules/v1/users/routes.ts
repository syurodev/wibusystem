import { AuthServiceApi } from "@repo/common";
import { Elysia } from "elysia";
import { Static } from "@sinclair/typebox";
import { UserProfileUpdateSchema } from "src/database/schema";
import { authPlugin } from "../../../plugins/auth.plugin";
import { userController } from "./controllers/user.controller";

const userApi = new AuthServiceApi("v1").getDefinition();

export const userRoutes = new Elysia()
  .use(authPlugin)
  .decorate("userService", userController["userService"])
  .get(
    userApi.users?.endpoints?.GET_USER_PROFILE_ME?.subPath ?? "/me",
    async (context: {
      user: { id: bigint; [key: string]: unknown };
      userService: (typeof userController)["userService"];
      set?: { status: number };
    }) => {
      const { user, userService, set } = context;
      return userController.getUserProfileMe({ user, userService, set });
    }
  )
  .put(
    userApi.users?.endpoints?.UPDATE_USER_PROFILE_ME?.subPath ?? "/me",
    { body: UserProfileUpdateSchema },
    async (context: {
      user: { id: bigint; [key: string]: unknown };
      userService: (typeof userController)["userService"];
      body: Static<typeof UserProfileUpdateSchema>;
      set?: { status: number };
    }) => {
      const { user, userService, body, set } = context;
      return userController.updateUserProfileMe({
        user,
        userService,
        body,
        set,
      });
    }
  );
