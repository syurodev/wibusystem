import { createGrpcClient } from '@repo/elysia-grpc';
import {
  PROTO_PATHS,
  PROTO_PACKAGES,
  ValidateTokenRequest,
  ValidateTokenResponse
} from '@repo/elysia-grpc';
import { APP_CONFIG } from '../configs';

/**
 * Service xử lý giao tiếp với Auth Service qua gRPC
 */
export class AuthGrpcService {
  private static instance: AuthGrpcService;
  private client: any;

  private constructor() {
    // Khởi tạo gRPC client kết nối với Auth Service
    this.client = createGrpcClient({
      serviceName: 'AuthService',
      packageName: PROTO_PACKAGES.auth,
      protoPath: PROTO_PATHS.auth,
      url: `localhost:${APP_CONFIG.AUTH_SERVICE_GRPC_PORT}`,
    });
  }

  /**
   * Lấy instance của AuthGrpcService (Singleton pattern)
   */
  public static getInstance(): AuthGrpcService {
    if (!AuthGrpcService.instance) {
      AuthGrpcService.instance = new AuthGrpcService();
    }
    return AuthGrpcService.instance;
  }

  /**
   * Xác thực token và lấy thông tin người dùng
   * @param token JWT token cần xác thực
   * @param deviceId ID của thiết bị đang gửi request
   * @returns Thông tin xác thực từ token
   */
  public async validateToken(token: string, deviceId?: string): Promise<ValidateTokenResponse> {
    try {
      // Tạo request với device_id nếu có
      const request: any = { 
        token,
        device_id: deviceId || ''
      };
      
      return new Promise<ValidateTokenResponse>((resolve, reject) => {
        this.client.ValidateToken(request, (error: Error | null, response: ValidateTokenResponse) => {
          if (error) {
            console.error('[gRPC Error]:', error);
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      console.error('[Auth gRPC Service Error]:', error);
      return {
        userId: '',
        email: '',
        isValid: false,
        error: error instanceof Error ? error.message : 'Unexpected error occurred',
        roles: [],
        permissions: [],
        sessionId: '',
        deviceId: ''
      };
    }
  }
}
