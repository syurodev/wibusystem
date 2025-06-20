import { userRepository } from "../../../../database";
import { RegisterAccountSchema } from "../schemas/register-account.schema";

/**
 * Service xử lý xác thực người dùng
 * Sử dụng Repository Pattern để tách biệt business logic và data access
 */
export class AuthService {
  constructor(private readonly userRepo = userRepository) {}

  async register(data: RegisterAccountSchema) {}
}
