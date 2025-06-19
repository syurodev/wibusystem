import { auth } from "./auth";
import { common } from "./common";
import { user } from "./user";

/**
 * Complete Vietnamese translations
 */
export const vi = {
  translation: {
    ...common,
    auth,
    user,
  },
} as const;
