// GRPC client helpers for inter-service communication

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { logger } from "../logger/index.js";

interface GrpcClientConfig {
  protoPath: string;
  serviceName: string;
  serverAddress: string;
  options?: grpc.ChannelOptions;
}

interface GrpcCallOptions {
  timeout?: number;
  metadata?: grpc.Metadata;
  retries?: number;
}

class GrpcClient {
  private readonly client: grpc.Client;
  private readonly serviceName: string;
  private readonly serverAddress: string;

  constructor(config: GrpcClientConfig) {
    this.serviceName = config.serviceName;
    this.serverAddress = config.serverAddress;

    try {
      // Load proto file
      const packageDefinition = protoLoader.loadSync(config.protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

      // Get service constructor
      const serviceConstructor = this.getServiceConstructor(
        protoDescriptor,
        config.serviceName
      );

      // Create client instance
      this.client = new serviceConstructor(
        config.serverAddress,
        grpc.credentials.createInsecure(),
        config.options
      );

      logger.info("GRPC client initialized", {
        service: config.serviceName,
        address: config.serverAddress,
      });
    } catch (error) {
      logger.error("Failed to initialize GRPC client", error as Error);
      throw error;
    }
  }

  private getServiceConstructor(
    protoDescriptor: any,
    serviceName: string
  ): any {
    // Navigate through the proto descriptor to find the service
    const parts = serviceName.split(".");
    let current = protoDescriptor;

    for (const part of parts) {
      if (current[part]) {
        current = current[part];
      } else {
        throw new Error(`Service ${serviceName} not found in proto definition`);
      }
    }

    return current;
  }

  async call<TRequest, TResponse>(
    method: string,
    request: TRequest,
    options: GrpcCallOptions = {}
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const {
        timeout = 5000,
        metadata = new grpc.Metadata(),
        retries = 3,
      } = options;

      const deadline = new Date();
      deadline.setMilliseconds(deadline.getMilliseconds() + timeout);

      const grpcLogger = logger.grpc(this.serviceName, method);

      grpcLogger.info("GRPC call started", { request });

      const makeCall = (attempt: number) => {
        (this.client as any)[method](
          request,
          metadata,
          { deadline },
          (error: grpc.ServiceError | null, response: TResponse) => {
            if (error) {
              grpcLogger.error("GRPC call failed", {
                error: error.message,
                code: error.code,
                attempt,
              });

              // Retry on certain error codes
              if (attempt < retries && this.shouldRetry(error.code)) {
                grpcLogger.info("Retrying GRPC call", { attempt: attempt + 1 });
                setTimeout(() => makeCall(attempt + 1), 1000 * attempt);
                return;
              }

              reject(error);
            } else {
              grpcLogger.info("GRPC call succeeded", { response });
              resolve(response);
            }
          }
        );
      };

      makeCall(1);
    });
  }

  private shouldRetry(code: grpc.status): boolean {
    return [
      grpc.status.UNAVAILABLE,
      grpc.status.DEADLINE_EXCEEDED,
      grpc.status.RESOURCE_EXHAUSTED,
    ].includes(code);
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - attempt to connect
      return new Promise((resolve) => {
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds() + 5);

        this.client.waitForReady(deadline, (error) => {
          if (error) {
            logger.warn("GRPC health check failed", {
              service: this.serviceName,
              error: error.message,
            });
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (error) {
      logger.error("GRPC health check error", error as Error);
      return false;
    }
  }

  close(): void {
    this.client.close();
    logger.info("GRPC client closed", { service: this.serviceName });
  }
}

// GRPC Service Registry for managing multiple services
class GrpcServiceRegistry {
  private readonly clients: Map<string, GrpcClient> = new Map();

  register(name: string, config: GrpcClientConfig): GrpcClient {
    if (this.clients.has(name)) {
      logger.warn("GRPC client already registered", { name });
      return this.clients.get(name)!;
    }

    const client = new GrpcClient(config);
    this.clients.set(name, client);

    logger.info("GRPC client registered", { name });
    return client;
  }

  get(name: string): GrpcClient | undefined {
    return this.clients.get(name);
  }

  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, client] of this.clients.entries()) {
      results[name] = await client.healthCheck();
    }

    return results;
  }

  closeAll(): void {
    for (const [name, client] of this.clients.entries()) {
      client.close();
      logger.info("GRPC client closed during cleanup", { name });
    }
    this.clients.clear();
  }
}

// Singleton registry instance
export const grpcRegistry = new GrpcServiceRegistry();

export { GrpcClient, GrpcServiceRegistry };
export type { GrpcCallOptions, GrpcClientConfig };
