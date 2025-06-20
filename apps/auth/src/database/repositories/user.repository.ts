import { BaseRepository } from "@repo/database";
import { SQL } from "bun";
import { UserModel } from "../models/user.model";

export class UserRepository extends BaseRepository<UserModel> {
  protected tableName = "users";

  constructor(sql: SQL) {
    super(sql);
  }
}
