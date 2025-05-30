import { Elysia } from "elysia";
import { APP_CONFIG } from "./configs/env";

const app = new Elysia()
  .get("/", () => "Hello Elysia")
  .listen(APP_CONFIG.SERVICE_PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
