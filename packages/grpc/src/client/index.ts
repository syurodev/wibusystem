import * as grpc from "@grpc/grpc-js";

export interface GrpcClientConfig {
  host: string;
  port: number;
  credentials?: grpc.ChannelCredentials;
  options?: grpc.ChannelOptions;
}

export class GrpcClientManager {
  private clients: Map<string, grpc.Client> = new Map();
  private config: GrpcClientConfig;

  constructor(config: GrpcClientConfig) {
    this.config = {
      credentials: grpc.credentials.createInsecure(),
      ...config,
    };
  }

  /**
   * Tạo hoặc lấy client cho service
   */
  getClient<T extends grpc.Client>(
    serviceName: string,
    ClientConstructor: new (
      address: string,
      credentials: grpc.ChannelCredentials,
      options?: grpc.ChannelOptions
    ) => T
  ): T {
    const existingClient = this.clients.get(serviceName);
    if (existingClient) {
      return existingClient as T;
    }

    const address = `${this.config.host}:${this.config.port}`;
    const client = new ClientConstructor(
      address,
      this.config.credentials!,
      this.config.options
    );

    this.clients.set(serviceName, client);
    return client;
  }

  /**
   * Đóng tất cả clients
   */
  closeAll(): void {
    this.clients.forEach((client, serviceName) => {
      client.close();
      console.log(`📴 Closed gRPC client for ${serviceName}`);
    });
    this.clients.clear();
  }

  /**
   * Đóng client cụ thể
   */
  close(serviceName: string): void {
    const client = this.clients.get(serviceName);
    if (client) {
      client.close();
      this.clients.delete(serviceName);
      console.log(`📴 Closed gRPC client for ${serviceName}`);
    }
  }

  /**
   * Kiểm tra kết nối tới server
   */
  async checkConnection(): Promise<boolean> {
    const address = `${this.config.host}:${this.config.port}`;

    return new Promise((resolve) => {
      const deadline = Date.now() + 5000; // 5 seconds timeout
      const channel = new grpc.Channel(
        address,
        this.config.credentials!,
        this.config.options || {}
      );

      channel.watchConnectivityState(
        grpc.connectivityState.IDLE,
        deadline,
        (err) => {
          if (err) {
            console.error("Connection check failed:", err);
            resolve(false);
          } else {
            resolve(true);
          }
          channel.close();
        }
      );
    });
  }
}

/**
 * Factory function để tạo gRPC client manager
 */
export function createGrpcClient(config: GrpcClientConfig): GrpcClientManager {
  return new GrpcClientManager(config);
}
