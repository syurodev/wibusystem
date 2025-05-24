import {
  grpc,
  GrpcProtoDefinition,
  ServiceImplementationMap,
  PROTO_PATHS,
  PROTO_PACKAGES
} from "@repo/elysia-grpc";
import { Elysia } from "elysia";
import { appConfig } from "./configs";
import { authServiceHandlers } from "./grpc/grpc.service";
import { appRoutes } from "./modules";
import { jwtPlugin } from "./plugins/jwt.plugin"; // Import JWT plugin
import { swaggerPlugin } from "./plugins/swagger.plugin";
import { handleAppError } from "./utils/error-formatter.util"; // Import hàm mới

// Định nghĩa Proto và Service Handlers cho gRPC plugin
const protoDefinitions: GrpcProtoDefinition[] = [
  {
    packageName: PROTO_PACKAGES.auth,
    protoPath: PROTO_PATHS.auth,
  },
];

const serviceHandlers: ServiceImplementationMap = {
  [`${PROTO_PACKAGES.auth}.AuthService`]: authServiceHandlers,
};

// Khởi tạo ứng dụng Elysia
const app = new Elysia()
  .onError((context) => {
    // Sử dụng context đầy đủ
    return handleAppError(context);
  })
  .use(swaggerPlugin)
  .use(jwtPlugin) // Thêm JWT plugin vào main app
  .use(appRoutes)
  .get("/", () => "Auth Service is running") // Route kiểm tra service hoạt động
  .use(
    grpc({
      url: `0.0.0.0:${appConfig.GRPC_PORT}`,
      protoDefinitions,
      serviceHandlers,
      protoLoaderOptions: {
        // Tùy chọn cho proto-loader nếu cần
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    })
  )
  .listen(appConfig.SERVICE_PORT);

console.log(
  `🦊 Auth Service is running at ${app.server?.hostname}:${app.server?.port}`
);
