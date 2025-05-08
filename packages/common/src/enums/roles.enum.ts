/**
 * Defines user roles in the system.
 * Each role should be a string for easier management.
 */
export enum Role {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  SUB_ADMIN = "SUB_ADMIN",
  GROUP_OWNER = "GROUP_OWNER",
  GROUP_MODERATOR = "GROUP_MODERATOR",
  ANIME_CREATOR = "ANIME_CREATOR",
  MANGA_CREATOR = "MANGA_CREATOR",
  NOVEL_CREATOR = "NOVEL_CREATOR",
  SELLER = "SELLER",
  BUYER = "BUYER",
  USER = "USER", // Basic user role
}
