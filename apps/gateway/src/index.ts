import { Elysia } from "elysia";
import { SERVICE_CONFIG } from "./configs";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .listen(SERVICE_CONFIG.SERVICE_PORT);

console.log(
  `🦊 Elysia ${SERVICE_CONFIG.SERVICE_NAME} service is running at ${app.server?.hostname}:${app.server?.port}`
);
