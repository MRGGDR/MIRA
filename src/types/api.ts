export interface ApiSuccess<TData, TMeta = Record<string, unknown>> {
  ok: true;
  data: TData;
  meta?: TMeta;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<TData, TMeta = Record<string, unknown>> =
  | ApiSuccess<TData, TMeta>
  | ApiFailure;

export interface PaginatedResponse<TItem> {
  items: TItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
