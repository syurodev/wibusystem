/**
 * User management English translations
 */
export const user = {
  // CRUD operations
  create: {
    success: "User created successfully",
    failed: "Failed to create user",
  },

  update: {
    success: "User updated successfully",
    failed: "Failed to update user",
    profile_success: "Profile updated successfully",
    settings_success: "Settings updated successfully",
  },

  delete: {
    success: "User deleted successfully",
    failed: "Failed to delete user",
    confirm: "Are you sure you want to delete this user?",
    cannot_delete_self: "You cannot delete your own account",
    has_dependencies: "Cannot delete user with existing dependencies",
  },

  // User states
  status: {
    activated: "User account activated",
    deactivated: "User account deactivated",
    suspended: "User account suspended",
    banned: "User account banned",
    verified: "User account verified",
  },

  // User information
  profile: {
    not_found: "User profile not found",
    incomplete: "Profile information is incomplete",
    avatar_updated: "Profile picture updated",
    avatar_removed: "Profile picture removed",
  },

  // Permissions and roles
  permissions: {
    granted: "Permissions granted successfully",
    revoked: "Permissions revoked successfully",
    insufficient: "Insufficient permissions",
    role_assigned: "Role assigned successfully",
    role_removed: "Role removed successfully",
  },

  // User preferences
  preferences: {
    updated: "Preferences updated successfully",
    reset: "Preferences reset to default",
    language_changed: "Language preference updated",
    timezone_changed: "Timezone preference updated",
    notifications_updated: "Notification preferences updated",
  },

  // Validation messages specific to user data
  validation: {
    username_required: "Username is required",
    username_taken: "Username is already taken",
    username_invalid: "Username contains invalid characters",
    email_required: "Email address is required",
    email_taken: "Email address is already registered",
    phone_invalid: "Invalid phone number format",
    birthdate_invalid: "Invalid birth date",
    age_requirement: "Must be at least 18 years old",
  },
} as const;
