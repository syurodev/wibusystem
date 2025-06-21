# Gateway Service - Reverse Proxy

Gateway service với cơ chế reverse proxy để route requests đến các microservices dựa trên header `x-project-id`.

## Cấu hình Services

- **3101** → Auth Service (localhost:3101)
- **3102** → Novel Service (localhost:3102)

## Cách sử dụng

### 1. Khởi động Gateway

```bash
cd apps/gateway
bun run dev
```

Gateway sẽ chạy tại: `http://localhost:3100`

### 2. Gửi request với x-project-id header

```bash
# Route đến Auth Service (3101)
curl -X GET "http://localhost:3100/api/users" \
  -H "x-project-id: 3101" \
  -H "Content-Type: application/json"

# Route đến Novel Service (3102)
curl -X POST "http://localhost:3100/api/novels" \
  -H "x-project-id: 3102" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Novel"}'
```

### 3. Endpoints đặc biệt

- **GET** `/health` - Health check
- **GET** `/gateway/info` - Thông tin gateway và danh sách services

## Cấu hình Environment Variables

```bash
# Gateway
SERVICE_PORT=3100
SERVICE_GRPC_PORT=31000

# Auth Service
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_PORT=3101

# Novel Service
NOVEL_SERVICE_HOST=localhost
NOVEL_SERVICE_PORT=3102
```

## Request Flow

1. Client gửi request với header `x-project-id`
2. Gateway kiểm tra và validate project ID
3. Gateway forward request đến service tương ứng
4. Service xử lý và trả response
5. Gateway forward response về client

## Error Responses

### Missing x-project-id header

```json
{
  "error": "Missing x-project-id header",
  "message": "Please provide x-project-id header to route your request",
  "availableServices": [...]
}
```

### Invalid project ID

```json
{
  "error": "Invalid project ID",
  "message": "Project ID 'xxx' is not supported",
  "availableServices": [...]
}
```

### Service unavailable

```json
{
  "error": "Proxy Error",
  "message": "Failed to proxy request: fetch failed"
}
```

## Response Headers

Gateway thêm các headers sau vào response:

- `X-Proxied-By: gateway` - Xác nhận đã đi qua gateway
- `X-Target-Service: <project-id>` - Service đã xử lý request
