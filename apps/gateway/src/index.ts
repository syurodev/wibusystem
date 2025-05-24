import { Elysia } from "elysia";
import { APP_CONFIG, PROXY } from "./configs";

const app = new Elysia();

// Reverse proxy for Auth service
app.all("/auth/*", async ({ request, params }) => {
  const path = (params as any)["*"] ?? "";
  const targetUrl = `http://${PROXY.AUTH_SERVICE_URL}/${path}`;

  // Forward the request, including method, headers, and body
  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});

// Reverse proxy for Novel service
app.all("/novel/*", async ({ request, params }) => {
  const path = (params as any)["*"] ?? "";
  const targetUrl = `http://${PROXY.NOVEL_SERVICE_URL}/${path}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
});

app.get("/", () => "Hello Elysia Gateway");

app.listen(APP_CONFIG.PORT);

console.log(
  `🦊 Elysia Gateway is running at ${app.server?.hostname}:${app.server?.port}`
);
