CREATE TABLE "password_reset_otps" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"expires_ts" bigint NOT NULL,
	"used_ts" bigint,
	"created_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"group_name" varchar(50) NOT NULL,
	"created_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL,
	"updated_ts" bigint NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"family_id" uuid NOT NULL,
	"device_info" text,
	"ip_address" varchar(45),
	"is_active" smallint DEFAULT 1 NOT NULL,
	"expires_ts" bigint NOT NULL,
	"created_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL,
	"revoked_ts" bigint,
	CONSTRAINT "refresh_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" integer NOT NULL,
	"permission_id" integer NOT NULL,
	"assigned_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"created_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL,
	"updated_ts" bigint NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" bigint NOT NULL,
	"role_id" integer NOT NULL,
	"assigned_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"hashed_password" varchar(255) NOT NULL,
	"account_status" smallint DEFAULT 0 NOT NULL,
	"full_name" varchar(255),
	"avatar_url" text,
	"last_login_ts" bigint,
	"created_ts" bigint DEFAULT EXTRACT(EPOCH FROM NOW())::bigint NOT NULL,
	"updated_ts" bigint NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_user_id" ON "password_reset_otps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_otp_hash" ON "password_reset_otps" USING btree ("otp_hash");--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_expires_ts" ON "password_reset_otps" USING btree ("expires_ts");--> statement-breakpoint
CREATE INDEX "idx_permissions_name" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_permissions_group_name" ON "permissions" USING btree ("group_name");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_user_id" ON "refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_token_hash" ON "refresh_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_family_id" ON "refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_ts" ON "refresh_tokens" USING btree ("expires_ts");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_role_id" ON "role_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_permissions_permission_id" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE INDEX "idx_roles_name" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_user_roles_user_id" ON "user_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_roles_role_id" ON "user_roles" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_account_status" ON "users" USING btree ("account_status");