import * as _grpc from "@grpc/grpc-js";
import * as _protoLoader from "@grpc/proto-loader";
import { Elysia } from "elysia";
import path from "path";

// Export định nghĩa Proto và các type
export * from './protos';


// Định nghĩa kiểu cho cấu hình của một proto file
export interface GrpcProtoDefinition {
  packageName: string; // Ví dụ: 'com.grpc.nodejs.wibusystem.auth'
  protoPath: string; // Đường dẫn tương đối hoặc tuyệt đối đến file .proto
}

// Định nghĩa kiểu cho các service implementations mà người dùng sẽ cung cấp
// Key là tên service đầy đủ (packageName.ServiceName), ví dụ: 'com.grpc.nodejs.wibusystem.auth.AuthService'
// Value là object chứa các method implementations
export type ServiceImplementationMap = {
  [qualifiedServiceName: string]: {
    [methodName: string]: _grpc.UntypedHandleCall; // Kiểu chung cho tất cả các loại RPC
  };
};

// Định nghĩa kiểu cho options của plugin
export interface ElysiaGrpcPluginOptions {
  url: string; // URL của gRPC server, ví dụ: '0.0.0.0:50051'
  protoDefinitions: GrpcProtoDefinition[]; // Mảng các định nghĩa proto
  serviceHandlers: ServiceImplementationMap; // Các hàm xử lý service
  protoLoaderOptions?: _protoLoader.Options; // Tùy chọn cho protoLoader
  serverCredentials?: _grpc.ServerCredentials; // Tùy chọn cho server credentials
}

// Định nghĩa kiểu cho options khi tạo gRPC client
export interface GrpcClientOptions {
  protoPath: string; // Đường dẫn đến file .proto
  packageName: string; // Tên package trong file .proto
  serviceName: string; // Tên service bạn muốn tạo client
  url: string; // Địa chỉ của gRPC server (ví dụ: 'localhost:50051')
  credentials?: _grpc.ChannelCredentials; // Credentials cho client, mặc định là insecure
  protoLoaderOptions?: _protoLoader.Options; // Tùy chọn cho protoLoader
}

// Hàm tiện ích để tạo gRPC client
export function createGrpcClient<TClient extends _grpc.Client = _grpc.Client>(
  options: GrpcClientOptions
): TClient {
  const absoluteProtoPath = path.resolve(options.protoPath);
  const packageDefinition = _protoLoader.loadSync(
    absoluteProtoPath,
    options.protoLoaderOptions ?? {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    }
  );
  const loadedPackage: any = _grpc.loadPackageDefinition(packageDefinition);
  let currentPackageRef = loadedPackage;
  const packageParts = options.packageName.split(".");
  for (const part of packageParts) {
    const nextPackageSegment = currentPackageRef?.[part];
    if (nextPackageSegment) {
      currentPackageRef = nextPackageSegment;
    } else {
      throw new Error(
        `[elysia-grpc-client] Package part "${part}" not found in proto definition for ${options.protoPath} under package ${options.packageName}.`
      );
    }
  }
  if (!currentPackageRef) {
    throw new Error(
      `[elysia-grpc-client] Package "${options.packageName}" not found or empty in proto definition for ${options.protoPath}.`
    );
  }
  const ServiceClientConstructor = currentPackageRef[options.serviceName];
  if (!ServiceClientConstructor) {
    throw new Error(
      `[elysia-grpc-client] Service "${options.serviceName}" not found in package "${options.packageName}" from proto file ${options.protoPath}.`
    );
  }
  if (typeof ServiceClientConstructor !== "function") {
    throw new Error(
      `[elysia-grpc-client] "${options.serviceName}" is not a valid service constructor in package "${options.packageName}". It might be a message type or a non-service component. Ensure the service name is correct and properly defined in the .proto file.`
    );
  }
  const client = new ServiceClientConstructor(
    options.url,
    options.credentials ?? _grpc.credentials.createInsecure()
  ) as TClient;
  console.log(
    `[elysia-grpc-client] Created client for service "${options.packageName}.${options.serviceName}" connecting to ${options.url}`
  );
  return client;
}

// Represents a loaded gRPC package structure.
// It's an object where keys are package names, service names, or message type names.
// Values can be nested packages, service constructors, or message type constructors/objects.
// Using Record<string, unknown> to enforce type checks on values.
type GrpcLoadedPackageContent = Record<string, unknown>;

// Represents a gRPC service constructor function as loaded by proto-loader.
// It's a function that also has a 'service' property containing the service definition.
interface LoadedGrpcServiceConstructor extends Function {
  service: _grpc.ServiceDefinition<any>; // 'any' for ImplementationType for simplicity
  // It may also have other static methods (client call methods), hence [key: string]: any
  [key: string]: any;
}

// Type guard to check if an unknown value is a LoadedGrpcServiceConstructor
function isLoadedGrpcServiceConstructor(
  value: unknown
): value is LoadedGrpcServiceConstructor {
  if (typeof value !== "function" || value === null) {
    return false;
  }
  // Check for the presence of the 'service' property, which is characteristic of gRPC service constructors
  return (
    Object.hasOwn(value, "service") &&
    typeof (value as LoadedGrpcServiceConstructor).service === "object" &&
    (value as LoadedGrpcServiceConstructor).service !== null
  );
}

// Helper function to load and verify a single proto definition's package
function _loadAndVerifyPackage(
  def: GrpcProtoDefinition,
  protoLoaderOptions?: _protoLoader.Options
): GrpcLoadedPackageContent | null {
  const absoluteProtoPath = path.resolve(def.protoPath);
  let packageDefinition;
  try {
    packageDefinition = _protoLoader.loadSync(
      absoluteProtoPath,
      protoLoaderOptions ?? {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      }
    );
  } catch (error: any) {
    console.warn(
      `[elysia-grpc] Error loading proto file ${def.protoPath}: ${error.message}. Skipping this definition.`
    );
    return null;
  }

  const initialLoadedPkg = _grpc.loadPackageDefinition(packageDefinition);
  if (typeof initialLoadedPkg !== "object" || initialLoadedPkg === null) {
    console.warn(
      `[elysia-grpc] Failed to load package definition for ${def.protoPath} as a valid object. Skipping.`
    );
    return null;
  }

  let currentRef: Record<string, unknown> = initialLoadedPkg as Record<
    string,
    unknown
  >; // Start with the loaded package as a base Record

  const packageParts = def.packageName.split(".");
  for (const part of packageParts) {
    // Before accessing currentRef[part], ensure currentRef is still a valid object for lookup
    if (typeof currentRef !== "object" || currentRef === null) {
      console.warn(
        `[elysia-grpc] Invalid package structure. Expected an object to find part "${part}" in "${def.packageName}" for proto ${def.protoPath}. Skipping.`
      );
      return null;
    }

    const segmentValue = currentRef[part]; // segmentValue is unknown

    if (segmentValue === undefined) {
      // Check if the part exists
      console.warn(
        `[elysia-grpc] Package part "${part}" not found within "${def.packageName}" for proto file ${def.protoPath}. Skipping this definition.`
      );
      return null;
    }

    // For the next iteration, the segmentValue must be an object to continue path traversal.
    if (typeof segmentValue !== "object" || segmentValue === null) {
      console.warn(
        `[elysia-grpc] Package part "${part}" in "${def.packageName}" is not a traversable object for proto file ${def.protoPath}. Current segment is not an object. Skipping.`
      );
      return null;
    }
    currentRef = segmentValue as Record<string, unknown>; // Narrow down for next iteration
  }
  // After the loop, currentRef should be the specific package object that matches GrpcLoadedPackageContent definition.
  return currentRef as GrpcLoadedPackageContent;
}

// Helper function to register service handlers for a loaded gRPC package
function _registerServiceHandlers(
  gRPCPackage: GrpcLoadedPackageContent,
  protoDef: GrpcProtoDefinition,
  allServiceHandlers: ServiceImplementationMap,
  grpcServerInstance: _grpc.Server
): void {
  for (const serviceNameInProto in gRPCPackage) {
    if (Object.hasOwn(gRPCPackage, serviceNameInProto)) {
      const serviceCandidate = gRPCPackage[serviceNameInProto]; // serviceCandidate is 'unknown'

      if (isLoadedGrpcServiceConstructor(serviceCandidate)) {
        // Now serviceCandidate is safely typed as LoadedGrpcServiceConstructor
        const qualifiedServiceName = `${protoDef.packageName}.${serviceNameInProto}`;
        const handlerImplementation = allServiceHandlers[qualifiedServiceName];

        if (handlerImplementation) {
          grpcServerInstance.addService(
            serviceCandidate.service, // Safe to access .service
            handlerImplementation
          );
          console.log(
            `[elysia-grpc] Registered service: ${qualifiedServiceName}`
          );
        } else {
          console.warn(
            `[elysia-grpc] No handler found for service: ${qualifiedServiceName}. This service will not be available.`
          );
        }
      } else {
        // Optional: Log if a property is found but it's not a recognized service constructor
        // This could be a message type, an enum, or a nested package that wasn't targeted by def.packageName
        // console.log(`[elysia-grpc] Property "${serviceNameInProto}" in package "${protoDef.packageName}" is not a recognized gRPC service constructor.`);
      }
    }
  }
}

export const grpc = (options: ElysiaGrpcPluginOptions) => (app: Elysia) => {
  const grpcServer = new _grpc.Server();

  options.protoDefinitions.forEach((def) => {
    const specificGrpcPackage = _loadAndVerifyPackage(
      def,
      options.protoLoaderOptions
    );
    if (specificGrpcPackage) {
      _registerServiceHandlers(
        specificGrpcPackage,
        def,
        options.serviceHandlers,
        grpcServer
      );
    }
  });

  // Handler creator for gRPC server bind completion (Level 3 definition)
  const makeBindCompleteHandler = (
    resolver: () => void,
    rejector: (reason?: any) => void,
    url: string // Pass options.url explicitly, so it's in this closure
  ) => {
    // This returned function's definition is lexically at Level 4
    return (err: Error | null, port: number) => {
      if (err) {
        console.error(
          `[elysia-grpc] Failed to bind server to ${url}: ${err.message}`
        );
        return rejector(new Error(err.message));
      }
      console.log(
        `[elysia-grpc] Server listening on ${url} (bound to port ${port})`
      );
      resolver();
    };
  };

  // Handler creator for gRPC server shutdown completion (Level 3 definition)
  const makeShutdownCompleteHandler = (resolver: () => void) => {
    // This returned function's definition is lexically at Level 4
    return (err?: Error | null) => {
      if (err) {
        console.error(
          `[elysia-grpc] Error during graceful shutdown: ${err.message}`
        );
      } else {
        console.log("[elysia-grpc] Server shutdown successfully.");
      }
      resolver(); // Always resolve to not block Elysia's shutdown
    };
  };

  async function _startGrpcServerInternal(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      grpcServer.bindAsync(
        options.url,
        options.serverCredentials ?? _grpc.ServerCredentials.createInsecure(),
        makeBindCompleteHandler(resolve, reject, options.url) // Use handler creator
      );
    });
  }

  async function _stopGrpcServerInternal(): Promise<void> {
    return new Promise<void>((resolve) => {
      console.log("[elysia-grpc] Attempting to shutdown gRPC server...");
      grpcServer.tryShutdown(makeShutdownCompleteHandler(resolve)); // Use handler creator
    });
  }

  app.onStart(_startGrpcServerInternal).onStop(_stopGrpcServerInternal);

  return app;
};

// Để người dùng có thể import grpc như là default export nếu muốn
export default grpc;
