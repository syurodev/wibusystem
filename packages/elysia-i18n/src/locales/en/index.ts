import { auth } from "./auth";
import { common } from "./common";
import { user } from "./user";

/**
 * Complete English translations
 */
export const en = {
  translation: {
    ...common,
    auth,
    user,
  },
} as const;
