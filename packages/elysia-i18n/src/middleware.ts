import { Elysia } from "elysia";
import { i18next, newLanguageDetector } from "elysia-i18next";
import {
  defaultLocale,
  fallbackLocale,
  resources,
  supportedLocales,
} from "./locales";

/**
 * i18next configuration for Elysia
 */
const i18nConfig = {
  initOptions: {
    lng: defaultLocale,
    fallbackLng: fallbackLocale,
    supportedLngs: supportedLocales,
    resources,
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    debug: process.env.NODE_ENV === "development",
  },
  detectLanguage: newLanguageDetector({
    searchParamName: "lang",
    storeParamName: "language",
    headerName: "accept-language",
    cookieName: "lang",
    pathParamName: "lang",
  }),
};

/**
 * Create i18n middleware for Elysia
 * @param config - Optional configuration override
 * @returns Elysia plugin with i18n support
 */
export const createI18nMiddleware = (config?: Partial<typeof i18nConfig>) => {
  const finalConfig = {
    ...i18nConfig,
    ...config,
    initOptions: {
      ...i18nConfig.initOptions,
      ...config?.initOptions,
    },
  };

  return new Elysia({ name: "i18n" })
    .use(i18next(finalConfig))
    .derive({ as: "global" }, ({ t }) => ({
      // Helper functions for common response messages
      i18n: {
        t, // Direct access to translation function

        // Common success messages
        success: {
          general: () => t("success.general"),
          create: () => t("success.create"),
          update: () => t("success.update"),
          delete: () => t("success.delete"),
          fetch: () => t("success.fetch"),
          save: () => t("success.save"),
          submit: () => t("success.submit"),
          process: () => t("success.process"),
        },

        // Common error messages
        error: {
          general: () => t("error.general"),
          notFound: () => t("error.not_found"),
          unauthorized: () => t("error.unauthorized"),
          forbidden: () => t("error.forbidden"),
          validation: () => t("error.validation"),
          internalServer: () => t("error.internal_server"),
          networkError: () => t("error.network_error"),
          timeout: () => t("error.timeout"),
        },

        // Auth messages
        auth: {
          loginSuccess: () => t("auth.login.success"),
          loginFailed: () => t("auth.login.failed"),
          logoutSuccess: () => t("auth.logout.success"),
          registerSuccess: () => t("auth.register.success"),
          invalidCredentials: () => t("auth.login.invalid_credentials"),
          tokenExpired: () => t("auth.token.expired"),
          passwordResetSent: () => t("auth.password.reset_sent"),
          passwordChanged: () => t("auth.password.change_success"),
        },

        // User messages
        user: {
          created: () => t("user.create.success"),
          updated: () => t("user.update.success"),
          deleted: () => t("user.delete.success"),
          notFound: () => t("user.profile.not_found"),
          profileUpdated: () => t("user.update.profile_success"),
        },

        // Common validation messages with interpolation
        validation: {
          requiredField: () => t("validation.required_field"),
          emailInvalid: () => t("validation.email_invalid"),
          phoneInvalid: () => t("validation.phone_invalid"),
          minLength: (count: number) => t("validation.min_length", { count }),
          maxLength: (count: number) => t("validation.max_length", { count }),
          fieldInvalid: (field: string) =>
            t("validation.field_invalid", { field }),
        },

        // Pagination
        pagination: {
          showingResults: (from: number, to: number, total: number) =>
            t("pagination.showing_results", { from, to, total }),
          noResults: () => t("pagination.no_results"),
          pageNotFound: () => t("pagination.page_not_found"),
        },

        // Common actions
        actions: {
          save: () => t("actions.save"),
          cancel: () => t("actions.cancel"),
          submit: () => t("actions.submit"),
          delete: () => t("actions.delete"),
          edit: () => t("actions.edit"),
          view: () => t("actions.view"),
          search: () => t("actions.search"),
          confirm: () => t("actions.confirm"),
        },
      },
    }));
};

/**
 * Default i18n middleware instance
 */
export const i18nMiddleware = createI18nMiddleware();
