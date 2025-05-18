import { AuthServiceApi } from "@repo/common";
import { Elysia } from "elysia";
import { Static } from "@sinclair/typebox";
import { authPlugin } from "../../../plugins/auth.plugin";
import { sessionController } from "./controllers/session.controller";

const sessionApi = new AuthServiceApi("v1").getDefinition();

export const sessionRoutes = new Elysia()
  .use(authPlugin)
  .decorate("sessionService", sessionController["sessionService"])
  .get(
    sessionApi.sessions?.endpoints?.GET_USER_SESSIONS?.subPath ?? "/",
    async (context) => {
      // Ép kiểu context rõ ràng
      const { user, sessionService, headers } = context as unknown as {
        user: { id: bigint; email?: string };
        sessionService: (typeof sessionController)["sessionService"];
        headers?: Record<string, string | undefined>;
      };
      return sessionController.getUserSessions({
        user,
        sessionService,
        headers,
      });
    }
  )
  .delete(
    sessionApi.sessions?.endpoints?.REVOKE_USER_SESSION?.subPath ??
      "/:sessionId",
    async (context) => {
      const { user, sessionService, params } = context as unknown as {
        user: { id: bigint; email?: string };
        sessionService: (typeof sessionController)["sessionService"];
        params: { sessionId: string };
      };
      return sessionController.revokeSession({ user, sessionService, params });
    }
  )
  .delete(
    sessionApi.sessions?.endpoints?.REVOKE_ALL_OTHER_SESSIONS?.subPath ??
      "/other",
    async (context) => {
      const { user, sessionService, headers } = context as unknown as {
        user: { id: bigint; email?: string };
        sessionService: (typeof sessionController)["sessionService"];
        headers?: Record<string, string | undefined>;
      };
      return sessionController.revokeAllOtherSessions({
        user,
        sessionService,
        headers,
      });
    }
  );
