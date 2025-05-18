ALTER TABLE "password_reset_otps" RENAME COLUMN "expires_ts" TO "expires_at";--> statement-breakpoint
ALTER TABLE "password_reset_otps" RENAME COLUMN "used_ts" TO "used_at";--> statement-breakpoint
ALTER TABLE "password_reset_otps" RENAME COLUMN "created_ts" TO "created_at";--> statement-breakpoint
ALTER TABLE "permissions" RENAME COLUMN "created_ts" TO "created_at";--> statement-breakpoint
ALTER TABLE "permissions" RENAME COLUMN "updated_ts" TO "updated_at";--> statement-breakpoint
ALTER TABLE "refresh_tokens" RENAME COLUMN "expires_ts" TO "expires_at";--> statement-breakpoint
ALTER TABLE "refresh_tokens" RENAME COLUMN "created_ts" TO "created_at";--> statement-breakpoint
ALTER TABLE "refresh_tokens" RENAME COLUMN "revoked_ts" TO "revoked_at";--> statement-breakpoint
ALTER TABLE "role_permissions" RENAME COLUMN "assigned_ts" TO "assigned_at";--> statement-breakpoint
ALTER TABLE "roles" RENAME COLUMN "created_ts" TO "created_at";--> statement-breakpoint
ALTER TABLE "roles" RENAME COLUMN "updated_ts" TO "updated_at";--> statement-breakpoint
ALTER TABLE "user_roles" RENAME COLUMN "assigned_ts" TO "assigned_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "last_login_ts" TO "last_login_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "created_ts" TO "created_at";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "updated_ts" TO "updated_at";--> statement-breakpoint
DROP INDEX "idx_password_reset_otps_expires_ts";--> statement-breakpoint
DROP INDEX "idx_refresh_tokens_expires_ts";--> statement-breakpoint
CREATE INDEX "idx_password_reset_otps_expires_at" ON "password_reset_otps" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" USING btree ("expires_at");