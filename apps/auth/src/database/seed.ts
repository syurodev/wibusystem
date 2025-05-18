import { dbUserConfig } from "../configs";
import { closeDbConnection, getDb } from "./connection";
import {
  permissionsTable,
  rolePermissionsTable,
  rolesTable,
} from "./schema/index"; // Adjusted import

// --- Data Definitions based on role-permission.md ---

const ALL_PERMISSIONS_NAMES = [
  "CONTENT_VIEW",
  "ANIME_CREATE",
  "MANGA_CREATE",
  "NOVEL_CREATE",
  "ANIME_EDIT_OWN",
  "MANGA_EDIT_OWN",
  "NOVEL_EDIT_OWN",
  "ANIME_EDIT_ALL",
  "MANGA_EDIT_ALL",
  "NOVEL_EDIT_ALL",
  "ANIME_PUBLISH_IMMEDIATE",
  "MANGA_PUBLISH_IMMEDIATE",
  "NOVEL_PUBLISH_IMMEDIATE",
  "ANIME_SUBMIT_FOR_APPROVAL",
  "MANGA_SUBMIT_FOR_APPROVAL",
  "NOVEL_SUBMIT_FOR_APPROVAL",
  "ANIME_APPROVE",
  "MANGA_APPROVE",
  "NOVEL_APPROVE",
  "ANIME_TRANSLATE_RAW",
  "MANGA_TRANSLATE_RAW",
  "NOVEL_TRANSLATE_RAW",
  "COMMENT_VIEW",
  "COMMENT_CREATE",
  "COMMENT_EDIT_OWN",
  "COMMENT_EDIT_ALL",
  "COMMENT_DELETE_OWN",
  "COMMENT_DELETE_ALL",
  "USER_VIEW",
  "USER_MANAGE",
  "SUBADMIN_MANAGE",
  "GROUP_MANAGE",
  "GROUP_MEMBER_MANAGE",
  "SYSTEM_CONFIG",
  "SELLER_MANAGE_PRODUCT",
  "SELLER_VIEW_ORDERS",
  "BUYER_MAKE_ORDER",
  "BUYER_VIEW_OWN_ORDERS",
];

// Helper function to determine group_name
function getPermissionGroup(permissionName: string): string {
  if (permissionName.startsWith("CONTENT_")) return "Content Viewing";
  if (permissionName.startsWith("ANIME_")) return "Anime Management";
  if (permissionName.startsWith("MANGA_")) return "Manga Management";
  if (permissionName.startsWith("NOVEL_")) return "Novel Management";
  if (permissionName.startsWith("COMMENT_")) return "Comment Management";
  if (permissionName.startsWith("USER_")) return "User Management";
  if (permissionName.startsWith("SUBADMIN_")) return "Sub-Admin Management";
  if (permissionName.startsWith("GROUP_")) return "Group Management";
  if (permissionName.startsWith("SYSTEM_")) return "System Configuration";
  if (permissionName.startsWith("SELLER_")) return "E-commerce Seller";
  if (permissionName.startsWith("BUYER_")) return "E-commerce Buyer";
  return "General"; // Default group
}

const permissionsData = ALL_PERMISSIONS_NAMES.map((name) => ({
  name,
  description: `Permission to ${name.toLowerCase().replace(/_/g, " ")}`,
  group_name: getPermissionGroup(name),
}));

const rolesData = [
  {
    name: "SYSTEM_ADMIN",
    description: "Has all permissions in the system.",
  },
  {
    name: "SUB_ADMIN",
    description: "Manages users, groups, and content approvals.",
  },
  {
    name: "GROUP_OWNER",
    description: "Owns and manages a specific group.",
  },
  {
    name: "GROUP_MODERATOR",
    description: "Moderates a specific group.",
  },
  {
    name: "ANIME_CREATOR",
    description: "Creates and manages anime content.",
  },
  {
    name: "MANGA_CREATOR",
    description: "Creates and manages manga content.",
  },
  {
    name: "NOVEL_CREATOR",
    description: "Creates and manages novel content.",
  },
  {
    name: "SELLER",
    description: "Manages products and views orders.",
  },
  {
    name: "BUYER",
    description: "Makes orders and views own orders.",
  },
  {
    name: "USER",
    description: "Basic user with content viewing and commenting rights.",
  },
];

// Define permissions for each role name
const rolePermissionMapping: Record<string, string[]> = {
  SYSTEM_ADMIN: ALL_PERMISSIONS_NAMES,
  USER: [
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  SUB_ADMIN: [
    "USER_VIEW",
    "USER_MANAGE",
    "SUBADMIN_MANAGE",
    "GROUP_MEMBER_MANAGE",
    "ANIME_CREATE",
    "MANGA_CREATE",
    "NOVEL_CREATE",
    "ANIME_EDIT_ALL",
    "MANGA_EDIT_ALL",
    "NOVEL_EDIT_ALL",
    "ANIME_APPROVE",
    "MANGA_APPROVE",
    "NOVEL_APPROVE",
    "COMMENT_EDIT_ALL",
    "COMMENT_DELETE_ALL",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  GROUP_OWNER: [
    "GROUP_MANAGE",
    "GROUP_MEMBER_MANAGE",
    "ANIME_CREATE",
    "MANGA_CREATE",
    "NOVEL_CREATE",
    "ANIME_EDIT_ALL",
    "MANGA_EDIT_ALL",
    "NOVEL_EDIT_ALL",
    "ANIME_APPROVE",
    "MANGA_APPROVE",
    "NOVEL_APPROVE",
    "ANIME_TRANSLATE_RAW",
    "MANGA_TRANSLATE_RAW",
    "NOVEL_TRANSLATE_RAW",
    "COMMENT_EDIT_ALL",
    "COMMENT_DELETE_ALL",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  GROUP_MODERATOR: [
    "GROUP_MEMBER_MANAGE",
    "ANIME_CREATE",
    "MANGA_CREATE",
    "NOVEL_CREATE",
    "ANIME_EDIT_ALL",
    "MANGA_EDIT_ALL",
    "NOVEL_EDIT_ALL",
    "ANIME_APPROVE",
    "MANGA_APPROVE",
    "NOVEL_APPROVE",
    "ANIME_TRANSLATE_RAW",
    "MANGA_TRANSLATE_RAW",
    "NOVEL_TRANSLATE_RAW",
    "COMMENT_EDIT_ALL",
    "COMMENT_DELETE_ALL",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  ANIME_CREATOR: [
    "ANIME_CREATE",
    "ANIME_EDIT_OWN",
    "ANIME_PUBLISH_IMMEDIATE",
    "ANIME_SUBMIT_FOR_APPROVAL",
    "ANIME_TRANSLATE_RAW",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  MANGA_CREATOR: [
    "MANGA_CREATE",
    "MANGA_EDIT_OWN",
    "MANGA_PUBLISH_IMMEDIATE",
    "MANGA_SUBMIT_FOR_APPROVAL",
    "MANGA_TRANSLATE_RAW",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  NOVEL_CREATOR: [
    "NOVEL_CREATE",
    "NOVEL_EDIT_OWN",
    "NOVEL_PUBLISH_IMMEDIATE",
    "NOVEL_SUBMIT_FOR_APPROVAL",
    "NOVEL_TRANSLATE_RAW",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  SELLER: [
    "SELLER_MANAGE_PRODUCT",
    "SELLER_VIEW_ORDERS",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
  BUYER: [
    "BUYER_MAKE_ORDER",
    "BUYER_VIEW_OWN_ORDERS",
    "CONTENT_VIEW",
    "COMMENT_VIEW",
    "COMMENT_CREATE",
    "COMMENT_EDIT_OWN",
    "COMMENT_DELETE_OWN",
  ],
};

async function seedDatabase() {
  console.log("Starting database seeding for roles and permissions...");
  const db = getDb();

  // 1. Seed Permissions
  console.log("Seeding permissions...");
  await db
    .insert(permissionsTable)
    .values(permissionsData)
    .onConflictDoNothing();

  // Fetch all permissions to ensure we have them for mapping.
  const allDbPermissions = await db
    .select({ id: permissionsTable.id, name: permissionsTable.name })
    .from(permissionsTable);
  const permissionNameToId = new Map(
    allDbPermissions.map((p) => [p.name, p.id])
  );
  console.log(`Upserted/found ${allDbPermissions.length} permissions.`);

  // 2. Seed Roles
  console.log("Seeding roles...");
  await db.insert(rolesTable).values(rolesData).onConflictDoNothing();

  // Fetch all roles
  const allDbRoles = await db
    .select({ id: rolesTable.id, name: rolesTable.name })
    .from(rolesTable);
  const roleNameToId = new Map(allDbRoles.map((r) => [r.name, r.id]));
  console.log(`Upserted/found ${allDbRoles.length} roles.`);

  // 3. Seed Role-Permission Mappings
  console.log("Seeding role-permission mappings...");
  const rolePermissionValues: Array<{
    role_id: number;
    permission_id: number;
  }> = [];

  for (const roleName in rolePermissionMapping) {
    const roleId = roleNameToId.get(roleName);
    if (!roleId) {
      console.warn(
        `Role name "${roleName}" not found in database. Skipping permissions for it.`
      );
      continue;
    }

    const permissionNamesForRole = rolePermissionMapping[roleName];
    for (const pName of permissionNamesForRole) {
      const permissionId = permissionNameToId.get(pName);
      if (!permissionId) {
        console.warn(
          `Permission name "${pName}" for role "${roleName}" not found. Skipping.`
        );
        continue;
      }
      rolePermissionValues.push({
        role_id: roleId,
        permission_id: permissionId,
      });
    }
  }

  if (rolePermissionValues.length > 0) {
    await db
      .insert(rolePermissionsTable)
      .values(rolePermissionValues)
      .onConflictDoNothing();
    console.log(
      `Inserted/updated ${rolePermissionValues.length} role-permission mappings.`
    );
  } else {
    console.log("No new role-permission mappings to insert.");
  }

  console.log("Database seeding completed.");
}

async function main() {
  if (
    !dbUserConfig.host ||
    !dbUserConfig.port ||
    !dbUserConfig.username ||
    !dbUserConfig.dbname
  ) {
    console.error(
      "Database connection parameters (host, port, username, dbname) are missing."
    );
    throw new Error("Database connection parameters are incomplete for seed.");
  }

  try {
    await seedDatabase();
  } catch (error) {
    console.error("Error during database seeding:", error);
    process.exit(1);
  } finally {
    await closeDbConnection();
    console.log("Database connection for seed script closed.");
  }
}

main();
