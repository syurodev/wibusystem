import { convertToMillis, now } from "@repo/common";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "src/database/connection";
import {
  NewSessionSchema,
  SessionSchema,
  sessionsTable, // Giữ nguyên tên import từ schema
} from "../database/schema/sessions.schema";
import { BaseRepository, DrizzleTransaction } from "./base.repository";

export class SessionRepository extends BaseRepository<
  typeof sessionsTable,
  NewSessionSchema
> {
  private static instance: SessionRepository;

  constructor() {
    super(sessionsTable);
  }

  public static getInstance(): SessionRepository {
    if (!SessionRepository.instance) {
      SessionRepository.instance = new SessionRepository();
    }
    return SessionRepository.instance;
  }

  async createSession(
    data: NewSessionSchema,
    tx?: DrizzleTransaction
  ): Promise<SessionSchema> {
    const queryRunner = tx || db;
    const results = await queryRunner
      .insert(this.table)
      .values(data)
      .returning();
    const newSession = results[0];
    if (!newSession) {
      throw new Error(
        "Failed to create session or retrieve the new session details."
      );
    }
    return newSession;
  }

  async findSessionById(
    sessionId: string,
    tx?: DrizzleTransaction
  ): Promise<SessionSchema | undefined> {
    const queryRunner = tx || db;
    const results = await queryRunner
      .select()
      .from(this.table)
      .where(eq(this.table.publicSessionId, sessionId));
    return results[0];
  }

  async findActiveSessionByUserIdAndUserDeviceId(
    userId: number,
    userDeviceId: number,
    tx?: DrizzleTransaction
  ): Promise<SessionSchema | undefined> {
    const queryRunner = tx || db;
    const results = await queryRunner
      .select()
      .from(this.table)
      .where(
        sql`${this.table.userId} = ${userId} AND ${this.table.userDeviceId} = ${userDeviceId} AND ${this.table.expiresAt} > ${convertToMillis(now())}`
      )
      .orderBy(desc(this.table.createdAt))
      .limit(1);
    return results[0];
  }

  async findSessionsByUserId(
    userId: number,
    limit: number = 10,
    offset: number = 0,
    tx?: DrizzleTransaction
  ): Promise<SessionSchema[]> {
    const queryRunner = tx || db;
    return queryRunner
      .select()
      .from(this.table)
      .where(eq(this.table.userId, userId))
      .orderBy(desc(this.table.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findByRefreshToken(
    hashedRefreshToken: string,
    tx?: DrizzleTransaction
  ): Promise<SessionSchema | undefined> {
    const queryRunner = tx || db;
    const results = await queryRunner
      .select()
      .from(this.table)
      .where(eq(this.table.hashedRefreshToken, hashedRefreshToken));
    return results[0];
  }

  async updateSession(
    sessionId: string,
    data: Partial<NewSessionSchema>,
    tx?: DrizzleTransaction
  ): Promise<SessionSchema | undefined> {
    const queryRunner = tx || db;
    const [updatedSession] = await queryRunner
      .update(this.table)
      .set(data)
      .where(eq(this.table.publicSessionId, sessionId))
      .returning();
    return updatedSession;
  }

  async deleteSessionById(
    sessionId: string,
    tx?: DrizzleTransaction
  ): Promise<void> {
    const queryRunner = tx || db;
    await queryRunner
      .delete(this.table)
      .where(eq(this.table.publicSessionId, sessionId));
  }

  async deleteSessionsByUserId(
    userId: number,
    tx?: DrizzleTransaction
  ): Promise<void> {
    const queryRunner = tx || db;
    await queryRunner.delete(this.table).where(eq(this.table.userId, userId));
  }

  async deleteExpiredSessions(tx?: DrizzleTransaction): Promise<void> {
    const queryRunner = tx || db;
    const currentEpochMillis = convertToMillis(now());

    await queryRunner
      .delete(this.table)
      .where(sql`${this.table.expiresAt} <= ${currentEpochMillis}`);
  }
}
