/**
 * @file Controller cho Session module.
 * @author Your Name
 */
import {
  HttpStatusCode,
  createErrorResponse,
  createSuccessResponse,
} from "@repo/common";
import { SessionService } from "../services/session.service";

interface SessionUser {
  id: bigint;
  email?: string;
}

export interface SessionControllerContext {
  user: SessionUser;
  sessionService: SessionService;
  headers?: Record<string, string | undefined>;
  params?: { sessionId: string };
}

export class SessionController {
  private static instance: SessionController;
  private readonly sessionService: SessionService;

  private constructor() {
    this.sessionService = SessionService.getInstance();
  }

  public static getInstance(): SessionController {
    if (!SessionController.instance) {
      SessionController.instance = new SessionController();
    }
    return SessionController.instance;
  }

  /**
   * Lấy danh sách phiên đang hoạt động của người dùng
   */
  public async getUserSessions(context: SessionControllerContext) {
    try {
      const sessions = await this.sessionService.getActiveSessions(
        context.user.id
      );
      const formattedSessions = sessions.map((session) => ({
        id: session.id,
        device_info: session.device_info,
        ip_address: session.ip_address,
        created_at: session.created_at,
        expires_at: session.expires_at,
      }));
      return createSuccessResponse(
        {
          list: formattedSessions,
          total_record: formattedSessions.length,
          total_page: 1,
        },
        "Lấy danh sách phiên thành công",
        HttpStatusCode.OK
      );
    } catch (error) {
      return createErrorResponse(
        "Đã xảy ra lỗi khi lấy danh sách phiên",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  /**
   * Thu hồi một phiên cụ thể
   */
  public async revokeSession(context: SessionControllerContext) {
    try {
      if (!context.params?.sessionId) {
        return createErrorResponse(
          "Thiếu sessionId",
          HttpStatusCode.BAD_REQUEST,
          "MISSING_SESSION_ID"
        );
      }
      const result = await this.sessionService.revokeSession(
        context.user.id,
        BigInt(context.params.sessionId)
      );
      if (!result) {
        return createErrorResponse(
          "Không tìm thấy phiên hoặc bạn không có quyền thu hồi phiên này",
          HttpStatusCode.NOT_FOUND,
          "RESOURCE_NOT_FOUND"
        );
      }
      return createSuccessResponse(
        {},
        "Thu hồi phiên thành công",
        HttpStatusCode.OK
      );
    } catch (error) {
      return createErrorResponse(
        "Đã xảy ra lỗi khi thu hồi phiên",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "INTERNAL_SERVER_ERROR"
      );
    }
  }

  /**
   * Thu hồi tất cả các phiên khác
   */
  public async revokeAllOtherSessions(context: SessionControllerContext) {
    try {
      const currentFamilyId =
        context.headers?.["x-refresh-token-family"] ||
        "00000000-0000-0000-0000-000000000000";
      const revokedCount = await this.sessionService.revokeAllOtherSessions(
        context.user.id,
        currentFamilyId
      );
      return createSuccessResponse(
        { revoked_sessions_count: revokedCount },
        "Thu hồi các phiên khác thành công",
        HttpStatusCode.OK
      );
    } catch (error) {
      return createErrorResponse(
        "Đã xảy ra lỗi khi thu hồi các phiên khác",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        "INTERNAL_SERVER_ERROR"
      );
    }
  }
}

export const sessionController = SessionController.getInstance();
