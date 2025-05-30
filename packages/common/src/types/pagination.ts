// Pagination types

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchParams {
  q?: string; // Search query
  filters?: Record<string, any>;
}

export interface ListParams
  extends PaginationParams,
    SortParams,
    SearchParams {}
