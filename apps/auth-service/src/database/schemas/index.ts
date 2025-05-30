import { ApiKey } from './api-key.schema';
import { Mfa } from './mfa.schema';
import { OrganizationInvitation } from './organization-invitation.schema';
import { OrganizationMembership } from './organization-membership.schema';
import { Organization } from './organization.schema';
import { PasswordReset } from './password-reset.schema';
import { Permission } from './permission.schema';
import { RateLimit } from './rate-limit.schema';
import { RolePermission } from './role-permission.schema';
import { Role } from './role.schema';
import { Session } from './session.schema';
import { TranslationGroupMembership } from './translation-group-membership.schema';
import { TranslationGroup } from './translation-group.schema';
import { UserAddress } from './user-address.schema';
import { UserFollow } from './user-follow.schema';
import { UserIdentity } from './user-identity.schema';
import { UserProfile } from './user-profile.schema';
import { UserRole } from './user-role.schema';
import { UserSubscription } from './user-subscription.schema';
import { User } from './user.schema';
import { VerificationCode } from './verification-code.schema';
import { Webhook } from './webhook.schema';

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
} as const;

export type DatabaseSchema = typeof databaseSchema;
