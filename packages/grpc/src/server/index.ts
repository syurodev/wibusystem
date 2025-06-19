import * as grpc from "@grpc/grpc-js";

export interface GrpcServerConfig {
  host?: string;
  port: number;
  credentials?: grpc.ServerCredentials;
  options?: grpc.ChannelOptions;
}

export interface ServiceDefinition {
  [serviceName: string]: grpc.ServiceDefinition;
}

export interface ServiceImplementation {
  [methodName: string]: any;
}

export class GrpcServer {
  private readonly server: grpc.Server;
  private readonly config: Required<GrpcServerConfig>;

  constructor(config: GrpcServerConfig) {
    this.config = {
      host: "0.0.0.0",
      credentials: grpc.ServerCredentials.createInsecure(),
      options: {},
      ...config,
    };
    this.server = new grpc.Server(this.config.options);
  }

  /**
   * Thêm service vào server
   */
  addService(
    serviceDefinition: grpc.ServiceDefinition,
    implementation: ServiceImplementation
  ): void {
    this.server.addService(serviceDefinition, implementation);
  }

  /**
   * Khởi động server
   */
  async start(): Promise<void> {
    const address = `${this.config.host}:${this.config.port}`;

    return new Promise((resolve, reject) => {
      this.server.bindAsync(address, this.config.credentials, (err, port) => {
        if (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
          return;
        }

        console.log(
          `🚀 gRPC Server started on ${address} (bound to port ${port})`
        );
        resolve();
      });
    });
  }

  /**
   * Tắt server
   */
  async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown((err) => {
        if (err) {
          console.error("Error during server shutdown:", err);
        }
        console.log("📴 gRPC Server shutdown");
        resolve();
      });
    });
  }

  /**
   * Force shutdown server
   */
  forceShutdown(): void {
    this.server.forceShutdown();
    console.log("⚡ gRPC Server force shutdown");
  }

  /**
   * Lấy server instance
   */
  getServer(): grpc.Server {
    return this.server;
  }
}

/**
 * Factory function để tạo gRPC server
 */
export function createGrpcServer(config: GrpcServerConfig): GrpcServer {
  return new GrpcServer(config);
}
