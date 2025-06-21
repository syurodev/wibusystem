import { BaseModel } from "@repo/database";

export interface SessionModel extends BaseModel {
  user_id: string | number;
  access_token: string;
  refresh_token: string;
  device_id: string;
  device_fingerprint: string;
  device_token: string;
  device_name: string;
  device_type: string;
  device_os: string;
  device_browser: string;
  user_agent: string;
  ip_address: string;
  roles: string[];
  permissions: string[];
  metadata: Record<string, any>;
  risk_score: number;
  request_count: number;
  last_used_at: string | number;
  is_active: boolean;
  is_blocked: boolean;
  blocked_reason: string;
  expires_at: string | number;
  revoked_at: string | number;
}
