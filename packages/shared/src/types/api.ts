import type { ErrorCode } from '../constants/index.js';

/** Present on every response, success or failure. */
export interface ResponseMeta {
  /** ISO-8601 time the response was produced. */
  timestamp: string;
  /** Correlates the response with server logs; echoed in the `X-Request-Id` header. */
  requestId?: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

/** One failed check on a field; `path` is dot-separated (e.g. `address.city`, `items.0.qty`). */
export interface ValidationIssue {
  path: string;
  message: string;
  code?: string;
}

export interface ApiErrorBody {
  code: ErrorCode;
  message: string;
  /** `ValidationIssue[]` when `code` is `VALIDATION_ERROR`; otherwise error-specific context. */
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiErrorBody;
  meta: ResponseMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
