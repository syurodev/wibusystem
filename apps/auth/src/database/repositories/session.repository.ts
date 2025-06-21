import { BaseRepository } from "@repo/database";
import { SQL } from "bun";
import { SessionModel } from "../models/session.model";

export class SessionRepository extends BaseRepository<SessionModel> {
  protected tableName = "sessions";

  constructor(sql: SQL) {
    super(sql);
  }
}
