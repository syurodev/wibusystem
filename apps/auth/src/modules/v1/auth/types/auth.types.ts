import { AccountStatus } from "../../../../types/enums";

export interface AuthUser {
  id: bigint;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  account_status: AccountStatus;
  hashed_password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: bigint;
    email: string;
    full_name?: string | null;
    avatar_url?: string | null;
  };
  access_token?: string;
  refresh_token?: string;
}

export interface TokenPayload {
  userId: bigint;
  exp: number;
  iat: number;
}
