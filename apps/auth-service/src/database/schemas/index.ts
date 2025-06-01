import { ApiKey } from "./api-key.schema";
import { DeviceToken } from "./device-token.schema";
import { Mfa } from "./mfa.schema";
import { OrganizationInvitation } from "./organization-invitation.schema";
import { OrganizationMembership } from "./organization-membership.schema";
import { Organization } from "./organization.schema";
import { PasswordReset } from "./password-reset.schema";
import { Permission } from "./permission.schema";
import { RateLimit } from "./rate-limit.schema";
import { RolePermission } from "./role-permission.schema";
import { Role } from "./role.schema";
import { Session } from "./session.schema";
import { TranslationGroupMembership } from "./translation-group-membership.schema";
import { TranslationGroup } from "./translation-group.schema";
import { UserAddress } from "./user-address.schema";
import { UserFollow } from "./user-follow.schema";
import { UserIdentity } from "./user-identity.schema";
import { UserProfile } from "./user-profile.schema";
import { UserRole } from "./user-role.schema";
import { UserSubscription } from "./user-subscription.schema";
import { User } from "./user.schema";
import { VerificationCode } from "./verification-code.schema";
import { Webhook } from "./webhook.schema";

/**
 * Database schema object chứa tất cả các tables
 * Sử dụng cho NestJS services và repositories
 */
export const databaseSchema = {
  // User related tables
  users: User,
  userProfiles: UserProfile,
  userIdentities: UserIdentity,
  userAddresses: UserAddress,
  userFollows: UserFollow,
  userRoles: UserRole,
  userSubscriptions: UserSubscription,

  // Organization related tables
  organizations: Organization,
  organizationMemberships: OrganizationMembership,
  organizationInvitations: OrganizationInvitation,

  // Translation related tables
  translationGroups: TranslationGroup,
  translationGroupMemberships: TranslationGroupMembership,

  // Auth related tables
  sessions: Session,
  apiKeys: ApiKey,
  mfa: Mfa,
  passwordResets: PasswordReset,
  verificationCodes: VerificationCode,

  // Permission related tables
  roles: Role,
  permissions: Permission,
  rolePermissions: RolePermission,

  // System tables
  webhooks: Webhook,
  rateLimits: RateLimit,
  deviceTokens: DeviceToken,
} as const;

export type DatabaseSchema = typeof databaseSchema;

export * from "./user-address.schema";
export * from "./user-follow.schema";
export * from "./user-identity.schema";
export * from "./user-profile.schema";
export * from "./user-role.schema";
export * from "./user-subscription.schema";
export * from "./user.schema";

export * from "./device-token.schema";
export * from "./session.schema";

export * from "./mfa.schema";
export * from "./password-reset.schema";
export * from "./verification-code.schema";

export * from "./organization-invitation.schema";
export * from "./organization-membership.schema";
export * from "./organization.schema";

export * from "./translation-group-membership.schema";
export * from "./translation-group.schema";

export * from "./permission.schema";
export * from "./role-permission.schema";
export * from "./role.schema";

export * from "./api-key.schema";
export * from "./rate-limit.schema";
export * from "./webhook.schema";
