export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDesc: boolean;
  searchTerm?: string;
}

export interface PagedResult<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  items: T[];
}
