CREATE TABLE "user_addresses" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"label" varchar(100) DEFAULT '' NOT NULL,
	"recipient_name" varchar(255) DEFAULT '' NOT NULL,
	"phone_number" varchar(20) DEFAULT '' NOT NULL,
	"address_line_1" text DEFAULT '' NOT NULL,
	"address_line_2" text DEFAULT '' NOT NULL,
	"city" varchar(100) DEFAULT '' NOT NULL,
	"state_province" varchar(100) DEFAULT '' NOT NULL,
	"postal_code" varchar(20) DEFAULT '' NOT NULL,
	"country" varchar(100) DEFAULT '' NOT NULL,
	"country_code" varchar(2) DEFAULT '' NOT NULL,
	"address_type" smallint DEFAULT 0 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"delivery_instructions" text DEFAULT '' NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"follower_id" bigint DEFAULT 0 NOT NULL,
	"following_id" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_identity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"identity_type" smallint DEFAULT 0 NOT NULL,
	"identity_value" varchar(255) DEFAULT '' NOT NULL,
	"provider" varchar(64) DEFAULT '' NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"preferred_language" varchar(10) DEFAULT 'vi' NOT NULL,
	"timezone" varchar(50) DEFAULT 'Asia/Ho_Chi_Minh' NOT NULL,
	"favorite_genres" json DEFAULT '[]'::json NOT NULL,
	"reading_preferences" json DEFAULT '{}'::json NOT NULL,
	"viewing_preferences" json DEFAULT '{}'::json NOT NULL,
	"total_reading_time" bigint DEFAULT 0 NOT NULL,
	"total_watching_time" bigint DEFAULT 0 NOT NULL,
	"is_profile_public" boolean DEFAULT true NOT NULL,
	"is_reading_list_public" boolean DEFAULT true NOT NULL,
	"is_watching_list_public" boolean DEFAULT true NOT NULL,
	"translation_languages" json DEFAULT '[]'::json NOT NULL,
	"translation_experience" smallint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_role" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"role_id" integer DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"plan_type" smallint DEFAULT 0 NOT NULL,
	"plan_name" varchar(100) DEFAULT '' NOT NULL,
	"payment_method" smallint DEFAULT 0 NOT NULL,
	"payment_provider" varchar(50) DEFAULT '' NOT NULL,
	"external_subscription_id" varchar(255) DEFAULT '' NOT NULL,
	"started_at" bigint DEFAULT 0 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"trial_ends_at" bigint DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"is_auto_renew" boolean DEFAULT true NOT NULL,
	"is_trial" boolean DEFAULT false NOT NULL,
	"features" json DEFAULT '{}'::json NOT NULL,
	"limits" json DEFAULT '{}'::json NOT NULL,
	"billing_cycle" smallint DEFAULT 1 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_name" varchar(255) DEFAULT '' NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"password" varchar(500) DEFAULT '' NOT NULL,
	"phone_number" varchar(20) DEFAULT '' NOT NULL,
	"display_name" varchar(255) DEFAULT '' NOT NULL,
	"avatar_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"bio" varchar(255) DEFAULT '' NOT NULL,
	"gender" smallint DEFAULT 0 NOT NULL,
	"date_of_birth" bigint DEFAULT 0 NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"is_phone_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "device_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"device_id" varchar(255) NOT NULL,
	"device_fingerprint" text DEFAULT '' NOT NULL,
	"access_token" text NOT NULL,
	"device_name" varchar(255) DEFAULT '' NOT NULL,
	"device_type" varchar(50) DEFAULT '' NOT NULL,
	"device_os" varchar(255) DEFAULT '' NOT NULL,
	"device_browser" varchar(255) DEFAULT '' NOT NULL,
	"user_agent" varchar(500) DEFAULT '' NOT NULL,
	"ip_address" varchar(64) DEFAULT '' NOT NULL,
	"location" varchar(255) DEFAULT '' NOT NULL,
	"permissions" json DEFAULT '[]'::json NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"request_count" bigint DEFAULT 0 NOT NULL,
	"last_used_at" bigint DEFAULT 0 NOT NULL,
	"risk_score" smallint DEFAULT 0 NOT NULL,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_reason" varchar(255) DEFAULT '' NOT NULL,
	"expires_at" bigint NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "device_tokens_device_id_unique" UNIQUE("device_id"),
	CONSTRAINT "device_tokens_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"refresh_token" text DEFAULT '' NOT NULL,
	"user_agent" varchar(500) DEFAULT '' NOT NULL,
	"ip_address" varchar(64) DEFAULT '' NOT NULL,
	"device_id" varchar(255) DEFAULT '' NOT NULL,
	"device_name" varchar(255) DEFAULT '' NOT NULL,
	"device_type" varchar(255) DEFAULT '' NOT NULL,
	"device_os" varchar(255) DEFAULT '' NOT NULL,
	"device_browser" varchar(255) DEFAULT '' NOT NULL,
	"device_location" varchar(255) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"revoked_at" bigint DEFAULT 0 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mfa" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"secret" varchar(64) DEFAULT '' NOT NULL,
	"type" smallint DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"token" varchar(255) DEFAULT '' NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verification_code" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"code" varchar(32) DEFAULT '' NOT NULL,
	"type" integer DEFAULT 0 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer DEFAULT 0 NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"token" varchar(255) DEFAULT '' NOT NULL,
	"role" smallint DEFAULT 0 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "organization_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_membership" (
	"id" serial PRIMARY KEY NOT NULL,
	"organization_id" integer DEFAULT 0 NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"role" smallint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"slug" varchar(255) DEFAULT '' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"domain" varchar(255) DEFAULT '' NOT NULL,
	"metadata" json DEFAULT '{}'::json NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "translation_group_membership" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"translation_group_id" bigint DEFAULT 0 NOT NULL,
	"user_id" bigint DEFAULT 0 NOT NULL,
	"role" smallint DEFAULT 0 NOT NULL,
	"specializations" json DEFAULT '[]'::json NOT NULL,
	"languages" json DEFAULT '[]'::json NOT NULL,
	"join_reason" varchar(500) DEFAULT '' NOT NULL,
	"experience_level" smallint DEFAULT 0 NOT NULL,
	"completed_projects" integer DEFAULT 0 NOT NULL,
	"total_contributions" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"is_public" boolean DEFAULT true NOT NULL,
	"can_recruit" boolean DEFAULT false NOT NULL,
	"joined_at" bigint DEFAULT 0 NOT NULL,
	"last_active_at" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation_groups" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"slug" varchar(255) DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"cover_url" text DEFAULT '' NOT NULL,
	"website_url" text DEFAULT '' NOT NULL,
	"discord_url" text DEFAULT '' NOT NULL,
	"specialties" json DEFAULT '[]'::json NOT NULL,
	"supported_languages" json DEFAULT '[]'::json NOT NULL,
	"recruitment_status" smallint DEFAULT 0 NOT NULL,
	"quality_level" smallint DEFAULT 1 NOT NULL,
	"total_projects" integer DEFAULT 0 NOT NULL,
	"total_members" integer DEFAULT 0 NOT NULL,
	"rating" integer DEFAULT 0 NOT NULL,
	"status" smallint DEFAULT 1 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_recruiting" boolean DEFAULT false NOT NULL,
	"contact_email" varchar(255) DEFAULT '' NOT NULL,
	"contact_person_id" integer DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "translation_groups_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permission" (
	"id" serial PRIMARY KEY NOT NULL,
	"role_id" integer DEFAULT 0 NOT NULL,
	"permission_id" integer DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) DEFAULT '' NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" integer DEFAULT 0 NOT NULL,
	"api_key" varchar(255) DEFAULT '' NOT NULL,
	"description" varchar(255) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL,
	CONSTRAINT "api_key_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255) DEFAULT '' NOT NULL,
	"type" smallint DEFAULT 0 NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" bigint DEFAULT 0 NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" varchar(500) DEFAULT '' NOT NULL,
	"secret" varchar(255) DEFAULT '' NOT NULL,
	"events" varchar(500) DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" bigint DEFAULT 0 NOT NULL,
	"updated_at" bigint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX "user_addresses_user_id_idx" ON "user_addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_addresses_country_idx" ON "user_addresses" USING btree ("country");--> statement-breakpoint
CREATE INDEX "user_addresses_is_default_idx" ON "user_addresses" USING btree ("is_default");--> statement-breakpoint
CREATE INDEX "user_addresses_address_type_idx" ON "user_addresses" USING btree ("address_type");--> statement-breakpoint
CREATE INDEX "user_follows_follower_idx" ON "user_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "user_follows_following_idx" ON "user_follows" USING btree ("following_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_follows_unique_idx" ON "user_follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE INDEX "user_identity_user_id_idx" ON "user_identity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_identity_value_idx" ON "user_identity" USING btree ("identity_value");--> statement-breakpoint
CREATE INDEX "user_identity_type_idx" ON "user_identity" USING btree ("identity_type");--> statement-breakpoint
CREATE INDEX "user_identity_provider_idx" ON "user_identity" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "user_identity_unique_idx" ON "user_identity" USING btree ("identity_type","identity_value","provider");--> statement-breakpoint
CREATE INDEX "user_profiles_user_id_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_profiles_preferred_language_idx" ON "user_profiles" USING btree ("preferred_language");--> statement-breakpoint
CREATE INDEX "user_role_user_id_idx" ON "user_role" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_role_role_id_idx" ON "user_role" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_role_unique_idx" ON "user_role" USING btree ("user_id","role_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_user_id_idx" ON "user_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_subscriptions_status_idx" ON "user_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_subscriptions_plan_type_idx" ON "user_subscriptions" USING btree ("plan_type");--> statement-breakpoint
CREATE INDEX "user_subscriptions_expires_at_idx" ON "user_subscriptions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_subscriptions_external_id_idx" ON "user_subscriptions" USING btree ("external_subscription_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("user_name");--> statement-breakpoint
CREATE INDEX "users_phone_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "users_display_name_fts_idx" ON "users" USING gin (to_tsvector('simple', "display_name"));--> statement-breakpoint
CREATE INDEX "device_tokens_device_id_idx" ON "device_tokens" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "device_tokens_access_token_idx" ON "device_tokens" USING btree ("access_token");--> statement-breakpoint
CREATE INDEX "device_tokens_fingerprint_idx" ON "device_tokens" USING btree ("device_fingerprint");--> statement-breakpoint
CREATE INDEX "device_tokens_ip_address_idx" ON "device_tokens" USING btree ("ip_address");--> statement-breakpoint
CREATE INDEX "device_tokens_expires_at_idx" ON "device_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "device_tokens_is_blocked_idx" ON "device_tokens" USING btree ("is_blocked");--> statement-breakpoint
CREATE INDEX "device_tokens_last_used_idx" ON "device_tokens" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_device_id_idx" ON "sessions" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "sessions_is_active_idx" ON "sessions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "mfa_user_id_idx" ON "mfa" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mfa_type_idx" ON "mfa" USING btree ("type");--> statement-breakpoint
CREATE INDEX "mfa_is_active_idx" ON "mfa" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "password_reset_user_id_idx" ON "password_resets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "password_resets" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_expires_at_idx" ON "password_resets" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification_code_user_id_idx" ON "verification_code" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_code_code_idx" ON "verification_code" USING btree ("code");--> statement-breakpoint
CREATE INDEX "verification_code_type_idx" ON "verification_code" USING btree ("type");--> statement-breakpoint
CREATE INDEX "verification_code_expires_at_idx" ON "verification_code" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "verification_code_is_used_idx" ON "verification_code" USING btree ("is_used");--> statement-breakpoint
CREATE INDEX "org_invitation_org_id_idx" ON "organization_invitations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_invitation_email_idx" ON "organization_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "org_invitation_token_idx" ON "organization_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "org_invitation_status_idx" ON "organization_invitations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "org_membership_org_id_idx" ON "organization_membership" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "org_membership_user_id_idx" ON "organization_membership" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "org_membership_unique_idx" ON "organization_membership" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "organizations_domain_idx" ON "organizations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "organizations_name_fts_idx" ON "organizations" USING gin (to_tsvector('simple', "name"));--> statement-breakpoint
CREATE INDEX "tg_membership_group_id_idx" ON "translation_group_membership" USING btree ("translation_group_id");--> statement-breakpoint
CREATE INDEX "tg_membership_user_id_idx" ON "translation_group_membership" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tg_membership_status_idx" ON "translation_group_membership" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tg_membership_role_idx" ON "translation_group_membership" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "tg_membership_unique_idx" ON "translation_group_membership" USING btree ("translation_group_id","user_id");--> statement-breakpoint
CREATE INDEX "translation_groups_slug_idx" ON "translation_groups" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "translation_groups_status_idx" ON "translation_groups" USING btree ("status");--> statement-breakpoint
CREATE INDEX "translation_groups_is_recruiting_idx" ON "translation_groups" USING btree ("is_recruiting");--> statement-breakpoint
CREATE INDEX "translation_groups_name_fts_idx" ON "translation_groups" USING gin (to_tsvector('simple', "name"));--> statement-breakpoint
CREATE INDEX "permissions_name_idx" ON "permissions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "permissions_is_system_idx" ON "permissions" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "role_permission_role_id_idx" ON "role_permission" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "role_permission_permission_id_idx" ON "role_permission" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "role_permission_unique_idx" ON "role_permission" USING btree ("role_id","permission_id");--> statement-breakpoint
CREATE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE INDEX "roles_is_system_idx" ON "roles" USING btree ("is_system");--> statement-breakpoint
CREATE INDEX "api_key_user_id_idx" ON "api_key" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_key_api_key_idx" ON "api_key" USING btree ("api_key");--> statement-breakpoint
CREATE INDEX "api_key_is_active_idx" ON "api_key" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "rate_limit_key_idx" ON "rate_limits" USING btree ("key");--> statement-breakpoint
CREATE INDEX "rate_limit_type_idx" ON "rate_limits" USING btree ("type");--> statement-breakpoint
CREATE INDEX "rate_limit_expires_at_idx" ON "rate_limits" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "webhooks_url_idx" ON "webhooks" USING btree ("url");--> statement-breakpoint
CREATE INDEX "webhooks_events_idx" ON "webhooks" USING btree ("events");