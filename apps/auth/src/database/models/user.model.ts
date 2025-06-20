import { BaseModel } from "@repo/database";
import { Gender, type EditorContent } from "@repo/types";

export interface UserModel extends BaseModel {
  user_name: string;
  email: string;
  password: string;
  phone_number: string;
  display_name: string;
  avatar_url: string;
  cover_url: string;
  bio: EditorContent[];
  gender: Gender;
  date_of_birth: string;
  metadata: Record<string, any>;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  is_deleted: boolean;
}
