import { and, eq, gte, lt, sql } from "drizzle-orm";
import type { Database } from "../database.provider";
import {
  DeviceToken,
  type DeviceTokenInsert,
  type DeviceTokenSelect,
} from "../schemas/device-token.schema";

export class DeviceTokenRepository {
  constructor(private db: Database) {}

  /**
   * Tạo token thiết bị mới
   */
  async create(data: DeviceTokenInsert): Promise<DeviceTokenSelect> {
    const [result] = await this.db.insert(DeviceToken).values(data).returning();

    return result;
  }

  /**
   * Tìm token thiết bị theo device_id
   */
  async findByDeviceId(deviceId: string): Promise<DeviceTokenSelect | null> {
    const [result] = await this.db
      .select()
      .from(DeviceToken)
      .where(eq(DeviceToken.device_id, deviceId))
      .limit(1);

    return result || null;
  }

  /**
   * Tìm token thiết bị theo access_token
   */
  async findByAccessToken(
    accessToken: string
  ): Promise<DeviceTokenSelect | null> {
    const [result] = await this.db
      .select()
      .from(DeviceToken)
      .where(
        and(
          eq(DeviceToken.access_token, accessToken),
          eq(DeviceToken.is_blocked, false),
          gte(DeviceToken.expires_at, Date.now())
        )
      )
      .limit(1);

    return result || null;
  }

  /**
   * Cập nhật thông tin sử dụng token
   */
  async updateUsage(deviceId: string): Promise<void> {
    await this.db
      .update(DeviceToken)
      .set({
        request_count: sql`${DeviceToken.request_count} + 1`,
        last_used_at: Date.now(),
        updated_at: Date.now(),
      })
      .where(eq(DeviceToken.device_id, deviceId));
  }

  /**
   * Block thiết bị với lý do
   */
  async blockDevice(deviceId: string, reason: string): Promise<void> {
    await this.db
      .update(DeviceToken)
      .set({
        is_blocked: true,
        blocked_reason: reason,
        updated_at: Date.now(),
      })
      .where(eq(DeviceToken.device_id, deviceId));
  }

  /**
   * Xóa các token đã hết hạn
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.db
      .delete(DeviceToken)
      .where(lt(DeviceToken.expires_at, Date.now()));
  }

  /**
   * Tìm thiết bị theo fingerprint (phát hiện duplicate)
   */
  async findByFingerprint(fingerprint: string): Promise<DeviceTokenSelect[]> {
    return await this.db
      .select()
      .from(DeviceToken)
      .where(eq(DeviceToken.device_fingerprint, fingerprint));
  }

  /**
   * Cập nhật risk score
   */
  async updateRiskScore(deviceId: string, riskScore: number): Promise<void> {
    await this.db
      .update(DeviceToken)
      .set({
        risk_score: riskScore,
        updated_at: Date.now(),
      })
      .where(eq(DeviceToken.device_id, deviceId));
  }
}
