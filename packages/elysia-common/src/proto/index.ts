// Proto files and gRPC utilities
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Proto file paths
export const PROTO_PATHS = {
  USER: join(__dirname, "user.proto"),
  AUTH: join(__dirname, "auth.proto"),
  NOTIFICATION: join(__dirname, "notification.proto"),
} as const;

// Proto loader options
const PROTO_OPTIONS: protoLoader.Options = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

/**
 * Load proto definition from file
 */
export const loadProtoDefinition = (protoPath: string) => {
  return protoLoader.loadSync(protoPath, PROTO_OPTIONS);
};

/**
 * Load gRPC package definition
 */
export const loadGrpcPackage = (protoPath: string) => {
  const packageDefinition = loadProtoDefinition(protoPath);
  return grpc.loadPackageDefinition(packageDefinition);
};

/**
 * Load all proto definitions
 */
export const loadAllProtos = () => {
  return {
    user: loadGrpcPackage(PROTO_PATHS.USER),
    auth: loadGrpcPackage(PROTO_PATHS.AUTH),
    notification: loadGrpcPackage(PROTO_PATHS.NOTIFICATION),
  };
};

/**
 * Create gRPC client for a service
 */
export const createGrpcClient = <T = any>(
  ServiceConstructor: new (
    address: string,
    credentials: grpc.ChannelCredentials
  ) => T,
  address: string,
  credentials?: grpc.ChannelCredentials
): T => {
  const creds = credentials ?? grpc.credentials.createInsecure();
  return new ServiceConstructor(address, creds);
};

/**
 * Get proto file path by service name
 */
export const getProtoPath = (serviceName: keyof typeof PROTO_PATHS): string => {
  return PROTO_PATHS[serviceName];
};

// Re-export proto paths for convenience
export { PROTO_PATHS as protoPaths };

// Service constructors type helper
export interface ServiceConstructors {
  UserService: any;
  AuthService: any;
  NotificationService: any;
}

/**
 * Load service constructors from proto definitions
 */
export const loadServiceConstructors = (): ServiceConstructors => {
  const protos = loadAllProtos();

  return {
    UserService: (protos.user as any).user.UserService,
    AuthService: (protos.auth as any).auth.AuthService,
    NotificationService: (protos.notification as any).notification
      .NotificationService,
  };
};
