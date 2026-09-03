export interface ServiceResponse<T = undefined> {
  status: number;
  message?: string;
  errors?: Record<string, string[]>;
  totalCount?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  data?: T;
}
