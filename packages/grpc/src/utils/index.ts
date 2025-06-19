import * as grpc from "@grpc/grpc-js";
import { AuthServiceServiceName } from "../generated/auth.js";

/**
 * Tạo service definition từ proto generated service
 */
export function createAuthServiceDefinition(): grpc.ServiceDefinition {
  return {
    validateToken: {
      path: `/${AuthServiceServiceName}/validateToken`,
      requestStream: false,
      responseStream: false,
      requestSerialize: (value: any) => Buffer.from(JSON.stringify(value)),
      requestDeserialize: (value: Buffer) => JSON.parse(value.toString()),
      responseSerialize: (value: any) => Buffer.from(JSON.stringify(value)),
      responseDeserialize: (value: Buffer) => JSON.parse(value.toString()),
    },
  };
}

/**
 * Helper để tạo metadata cho gRPC calls
 */
export function createMetadata(data: Record<string, string>): grpc.Metadata {
  const metadata = new grpc.Metadata();
  Object.entries(data).forEach(([key, value]) => {
    metadata.add(key, value);
  });
  return metadata;
}

/**
 * Helper để xử lý gRPC errors
 */
export function handleGrpcError(error: any): {
  code: grpc.status;
  message: string;
  details?: any;
} {
  if (error.code && error.message) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  return {
    code: grpc.status.INTERNAL,
    message: "Unknown gRPC error",
    details: error,
  };
}

/**
 * Tạo gRPC credentials từ config
 */
export function createCredentials(options?: {
  secure?: boolean;
  cert?: Buffer;
  key?: Buffer;
  ca?: Buffer;
}): grpc.ChannelCredentials {
  if (!options?.secure) {
    return grpc.credentials.createInsecure();
  }

  if (options.cert && options.key) {
    return grpc.credentials.createSsl(options.ca, options.key, options.cert);
  }

  return grpc.credentials.createSsl(options.ca);
}
