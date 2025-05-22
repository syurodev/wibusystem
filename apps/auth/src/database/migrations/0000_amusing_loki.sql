CREATE TABLE "password_reset_otps" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"otp_hash" varchar(255) DEFAULT '' NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"used_at" bigint DEFAULT 0,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) DEFAULT '' NOT NULL,
	"description" text DEFAULT '',
	"group_name" varchar(50) DEFAULT '' NOT NULL,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"token_hash" varchar(255) DEFAULT '' NOT NULL,
	"family_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_device_id" bigint DEFAULT 0,
	"device_info" text DEFAULT '',
	"ip_address" varchar(45) DEFAULT '',
	"is_active" smallint DEFAULT 1 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"revoked_at" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer DEFAULT 0 NOT NULL,
	"permission_id" integer DEFAULT 0 NOT NULL,
	"assigned_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"public_session_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"user_id" bigint NOT NULL,
	"user_device_id" bigint NOT NULL,
	"hashed_refresh_token" text NOT NULL,
	"family_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"revoked_at" bigint DEFAULT 0 NOT NULL,
	"is_active" smallint DEFAULT 1 NOT NULL,
	CONSTRAINT "sessions_public_session_id_unique" UNIQUE("public_session_id")
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"fingerprint" varchar(255) DEFAULT '' NOT NULL,
	"name" varchar(100) DEFAULT '',
	"type" smallint DEFAULT 0 NOT NULL,
	"model" varchar(100) DEFAULT '',
	"os_name" varchar(50) DEFAULT '',
	"os_version" varchar(50) DEFAULT '',
	"browser_name" varchar(50) DEFAULT '',
	"browser_version" varchar(50) DEFAULT '',
	"last_known_ip" varchar(45) DEFAULT '',
	"last_user_agent" text DEFAULT '',
	"is_trusted" smallint DEFAULT 0 NOT NULL,
	"last_seen_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"revoked_at" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_mfa_backup_codes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_mfa_setting_id" bigint DEFAULT 0 NOT NULL,
	"code_hash" varchar(255) DEFAULT '' NOT NULL,
	"is_used" smallint DEFAULT 0 NOT NULL,
	"used_at" bigint DEFAULT 0,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mfa_settings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"method_type" smallint DEFAULT 0 NOT NULL,
	"secret_key" text DEFAULT '' NOT NULL,
	"is_enabled" smallint DEFAULT 0 NOT NULL,
	"verified_at" bigint DEFAULT 0,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" bigint DEFAULT 0 NOT NULL,
	"role_id" integer DEFAULT 0 NOT NULL,
	"assigned_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user_social_accounts" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"provider_name" varchar(50) DEFAULT '' NOT NULL,
	"provider_user_id" varchar(255) DEFAULT '' NOT NULL,
	"email" varchar(255) DEFAULT '',
	"display_name" varchar(255) DEFAULT '',
	"avatar_url" text DEFAULT '',
	"access_token_hash" text DEFAULT '',
	"refresh_token_hash" text DEFAULT '',
	"scopes" text DEFAULT '',
	"linked_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"hashed_password" varchar(255) DEFAULT '' NOT NULL,
	"account_status" smallint DEFAULT 2 NOT NULL,
	"display_name" varchar(255) DEFAULT '',
	"username" varchar(255) DEFAULT '',
	"avatar_url" text DEFAULT '',
	"cover_url" text DEFAULT '',
	"last_login_at" bigint DEFAULT 0,
	"email_verified_at" bigint DEFAULT 0,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"updated_at" bigint DEFAULT extract(epoch from now()) NOT NULL,
	"deleted_at" bigint DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"token_type" smallint DEFAULT 0 NOT NULL,
	"token_hash" varchar(255) DEFAULT '' NOT NULL,
	"target" varchar(255) DEFAULT '' NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"is_used" smallint DEFAULT 0 NOT NULL,
	"used_at" bigint DEFAULT 0,
	"created_at" bigint DEFAULT extract(epoch from now()) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_device_id_user_devices_id_fk" FOREIGN KEY ("user_device_id") REFERENCES "public"."user_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_user_id" ON "password_reset_otps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_otp_hash" ON "password_reset_otps" USING btree ("otp_hash");--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_expires_at" ON "password_reset_otps" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_permissions_name" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_permissions_group_name" ON "permissions" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_device_id" ON "refresh_tokens" USING btree ("user_device_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_roles_name" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_device_id" ON "sessions" USING btree ("user_device_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_hashed_refresh_token" ON "sessions" USING btree ("hashed_refresh_token");--> statement-breakpoint
CREATE INDEX "idx_sessions_family_id" ON "sessions" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires_at" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_sessions_is_active" ON "sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_user_devices_user_id" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_devices_user_fingerprint" ON "user_devices" USING btree ("user_id","fingerprint");--> statement-breakpoint
CREATE INDEX "idx_user_devices_type" ON "user_devices" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_user_devices_is_trusted" ON "user_devices" USING btree ("is_trusted");--> statement-breakpoint
CREATE INDEX "idx_user_devices_last_seen_at" ON "user_devices" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "idx_user_mfa_backup_codes_setting_id" ON "user_mfa_backup_codes" USING btree ("user_mfa_setting_id");--> statement-breakpoint
CREATE INDEX "idx_user_mfa_backup_codes_is_used" ON "user_mfa_backup_codes" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "idx_user_mfa_settings_user_id" ON "user_mfa_settings" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_mfa_user_method" ON "user_mfa_settings" USING btree ("user_id","method_type");--> statement-breakpoint
CREATE INDEX "idx_user_mfa_settings_method_type" ON "user_mfa_settings" USING btree ("method_type");--> statement-breakpoint
CREATE INDEX "idx_user_mfa_settings_is_enabled" ON "user_mfa_settings" USING btree ("is_enabled");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_user_social_accounts_user_id" ON "user_social_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_social_provider_user" ON "user_social_accounts" USING btree ("provider_name","provider_user_id");--> statement-breakpoint
CREATE INDEX "idx_user_social_accounts_email" ON "user_social_accounts" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_account_status" ON "users" USING btree ("account_status");--> statement-breakpoint
CREATE INDEX "idx_users_username_fts" ON "users" USING gin (to_tsvector('simple', "username"));--> statement-breakpoint
CREATE INDEX "idx_users_display_name_fts" ON "users" USING gin (to_tsvector('simple', "display_name"));--> statement-breakpoint
CREATE INDEX "idx_verification_tokens_user_id" ON "verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_verification_tokens_hash" ON "verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_verification_tokens_type_target" ON "verification_tokens" USING btree ("token_type","target");--> statement-breakpoint
CREATE INDEX "idx_verification_tokens_expires_at" ON "verification_tokens" USING btree ("expires_at");