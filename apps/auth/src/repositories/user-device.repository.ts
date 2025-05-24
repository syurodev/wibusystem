import { convertToMillis, now } from "@repo/common";
import { db } from "../database/connection";
import {
  NewUserDevice,
  UserDevice,
  userDevices,
} from "../database/schema/user-devices.schema";
import { BaseRepository, DrizzleTransaction } from "./base.repository";

export class UserDeviceRepository extends BaseRepository<
  typeof userDevices,
  NewUserDevice
> {
  private static instance: UserDeviceRepository;

  private constructor() {
    super(userDevices);
  }

  public static getInstance(): UserDeviceRepository {
    if (!UserDeviceRepository.instance) {
      UserDeviceRepository.instance = new UserDeviceRepository();
    }
    return UserDeviceRepository.instance;
  }

  /**
   * Tạo mới hoặc cập nhật thông tin thiết bị người dùng.
   * Nếu thiết bị với userId và fingerprint đã tồn tại, nó sẽ được cập nhật.
   * Nếu không, một thiết bị mới sẽ được tạo.
   * @param data Dữ liệu thiết bị người dùng
   * @param tx Transaction tùy chọn
   * @returns Bản ghi thiết bị đã được tạo hoặc cập nhật
   */
  public async upsertDevice(
    data: NewUserDevice,
    tx?: DrizzleTransaction
  ): Promise<UserDevice | null> {
    const nowEpoch = convertToMillis(now());
    const queryRunner = tx ?? db;

    try {
      const result = await queryRunner
        .insert(userDevices)
        .values({
          userId: data.userId,
          fingerprint: data.fingerprint,
          lastKnownIp: data.lastKnownIp,
          lastUserAgent: data.lastUserAgent,
          model: data.model,
          type: data.type,
          osName: data.osName,
          osVersion: data.osVersion,
          browserName: data.browserName,
          browserVersion: data.browserVersion,
          isTrusted: data.isTrusted,
          name: data.name,
          lastSeenAt: nowEpoch, // Cập nhật lastSeenAt khi upsert
          // createdAt sẽ tự động được set bởi DB default nếu là insert mới
          updatedAt: nowEpoch, // Sẽ được set bởi $onUpdate khi update
        })
        .onConflictDoUpdate({
          target: [userDevices.userId, userDevices.fingerprint],
          set: {
            lastKnownIp: data.lastKnownIp,
            lastUserAgent: data.lastUserAgent,
            model: data.model,
            // Không nên cập nhật type nếu đã có, trừ khi có logic cụ thể
            // type: data.type,
            osName: data.osName,
            osVersion: data.osVersion,
            browserName: data.browserName,
            browserVersion: data.browserVersion,
            isTrusted: data.isTrusted,
            name: data.name,
            lastSeenAt: nowEpoch,
            updatedAt: nowEpoch,
          },
        })
        .returning();

      return result[0] ?? null;
    } catch (error) {
      console.error("Error in upsertDevice:", error);
      // Trong môi trường production, bạn có thể muốn throw một lỗi cụ thể hơn
      // hoặc xử lý lỗi theo cách khác thay vì chỉ log ra console.
      throw new Error("Failed to upsert user device.");
    }
  }

  // Có thể thêm các phương thức khác ở đây nếu cần
  // Ví dụ: findByUserId, findByFingerprint, revokeDevice, etc.
}
