import { useMemo } from 'react';
import type { Paginated } from '@umc/shared';
import type { SelectOption } from '@/components/forms/select-field';
import { useAllPagesQuery } from './use-all-pages-query';
import { useApiQuery, type ApiQuery } from './use-api-query';

/** Choices for a select, plus whether they are still loading or failed to load. */
export interface SelectOptionsSource {
  options: SelectOption[];
  /** True until the first list arrives. */
  loading: boolean;
  failed: boolean;
}

export const byOptionLabel = (a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label);

/** Options built from one page of the list at `path`, sorted by label. */
export function useSelectOptions<T>(
  path: string,
  toOption: (item: T) => SelectOption,
): SelectOptionsSource {
  const { data, error, loading } = useApiQuery<Paginated<T>>(path);
  const options = useMemo(
    () => (data?.items.map(toOption) ?? []).sort(byOptionLabel),
    [data, toOption],
  );
  return { options, loading: loading && !data, failed: error !== undefined };
}

/** `options` derived from an all-pages `query`, with its loading and failure state. */
export function toOptionsSource<T>(
  query: ApiQuery<T[]>,
  options: SelectOption[],
): SelectOptionsSource {
  const failed = query.error !== undefined;
  return { options, loading: query.data === undefined && !failed, failed };
}

/**
 * Options built from every page of the list at `path`, sorted by label. Pass `toOption` as a
 * stable (module-level) function.
 */
export function useAllPagesSelectOptions<T>(
  path: string,
  toOption: (item: T) => SelectOption,
  params?: Readonly<Record<string, string | undefined>>,
): SelectOptionsSource {
  const query = useAllPagesQuery<T>(path, params);
  const options = useMemo(
    () => (query.data?.map(toOption) ?? []).sort(byOptionLabel),
    [query.data, toOption],
  );
  return toOptionsSource(query, options);
}
