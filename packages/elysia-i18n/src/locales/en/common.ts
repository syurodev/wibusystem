/**
 * Common English translations - Shared across all services
 */
export const common = {
  // General success messages
  success: {
    general: "Success",
    create: "Created successfully",
    update: "Updated successfully",
    delete: "Deleted successfully",
    fetch: "Data retrieved successfully",
    save: "Saved successfully",
    submit: "Submitted successfully",
    process: "Processed successfully",
  },

  // General error messages
  error: {
    general: "An error occurred",
    not_found: "Resource not found",
    unauthorized: "Unauthorized access",
    forbidden: "Access forbidden",
    validation: "Validation failed",
    internal_server: "Internal server error",
    invalid_input: "Invalid input provided",
    missing_field: "Required field is missing",
    duplicate_entry: "Resource already exists",
    network_error: "Network connection error",
    timeout: "Request timeout",
  },

  // Common validation messages
  validation: {
    required_field: "This field is required",
    email_invalid: "Invalid email format",
    phone_invalid: "Invalid phone number format",
    url_invalid: "Invalid URL format",
    min_length: "Minimum {{count}} characters required",
    max_length: "Maximum {{count}} characters allowed",
    min_value: "Minimum value is {{min}}",
    max_value: "Maximum value is {{max}}",
    field_invalid: "{{field}} is invalid",
    format_invalid: "Invalid format",
  },

  // Pagination
  pagination: {
    showing_results: "Showing {{from}} to {{to}} of {{total}} results",
    no_results: "No results found",
    page_not_found: "Page not found",
    items_per_page: "Items per page",
    go_to_page: "Go to page",
    previous: "Previous",
    next: "Next",
    first: "First",
    last: "Last",
  },

  // Common actions
  actions: {
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    reset: "Reset",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    export: "Export",
    import: "Import",
    download: "Download",
    upload: "Upload",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    back: "Back",
    continue: "Continue",
    confirm: "Confirm",
  },
} as const;
