import {
  createErrorResponse,
  createSuccessResponse,
  HttpStatusCode,
  MessageCode,
} from "@repo/common";
import { UserService } from "../services/user.service";
import { UserProfileUpdate } from "../../../../database/schema/users.schema";

interface UserControllerContext {
  userService: UserService;
  user: {
    id: bigint;
    [key: string]: unknown;
  };
  body?: unknown;
  set?: { status: number };
}

export class UserController {
  private static instance: UserController;
  private readonly userService: UserService;

  private constructor() {
    this.userService = UserService.getInstance();
  }

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  /**
   * Lấy thông tin cá nhân của người dùng
   */
  public async getUserProfileMe(context: UserControllerContext) {
    const { user, set } = context;
    try {
      const userProfile = await this.userService.getUserProfile(user.id);
      return createSuccessResponse(
        userProfile,
        "Lấy thông tin người dùng thành công",
        HttpStatusCode.OK
      );
    } catch (error) {
      if (set) {
        set.status = HttpStatusCode.INTERNAL_SERVER_ERROR;
      }
      return createErrorResponse(
        "Đã xảy ra lỗi khi lấy thông tin người dùng",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        MessageCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Cập nhật thông tin cá nhân của người dùng
   */
  public async updateUserProfileMe(context: UserControllerContext) {
    const { user, body, set } = context;
    try {
      // Ép kiểu body về UserProfileUpdate để đảm bảo type an toàn
      const profileUpdate: UserProfileUpdate = body as UserProfileUpdate;
      const updatedUser = await this.userService.updateUserProfile(user.id, profileUpdate);
      return createSuccessResponse(
        updatedUser,
        "Cập nhật thông tin người dùng thành công",
        HttpStatusCode.OK
      );
    } catch (error) {
      if (set) {
        set.status = HttpStatusCode.INTERNAL_SERVER_ERROR;
      }
      return createErrorResponse(
        "Đã xảy ra lỗi khi cập nhật thông tin người dùng",
        HttpStatusCode.INTERNAL_SERVER_ERROR,
        MessageCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const userController = UserController.getInstance();
