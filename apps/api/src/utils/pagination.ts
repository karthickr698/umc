import type { Paginated } from '@umc/shared';

export interface PageRequest {
  page: number;
  pageSize: number;
}

export interface SkipLimit {
  skip: number;
  limit: number;
}

export function toSkipLimit({ page, pageSize }: PageRequest): SkipLimit {
  return { skip: (page - 1) * pageSize, limit: pageSize };
}

export function toPaginated<T>(
  items: T[],
  total: number,
  { page, pageSize }: PageRequest,
): Paginated<T> {
  return {
    items,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}
