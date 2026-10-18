import type { Paginated } from '@umc/shared';
import { ListFilters } from '@/components/filters/list-filters';
import { useApiQuery } from '@/hooks/use-api-query';
import { useListParams } from '@/hooks/use-list-params';
import { ResourceListView, type ResourceListViewProps } from './resource-list-view';

export type { ResourceFormProps } from './resource-list-view';

export interface ResourceListPageProps<T extends { id: string }> extends Omit<
  ResourceListViewProps<T>,
  'list' | 'filters' | 'filtered' | 'onPageChange'
> {
  statuses: readonly string[];
  searchLabel: string;
  /** Filters fixed by the page, e.g. the contractor whose workers are listed. */
  scope?: Readonly<Record<string, string>>;
}

/** A list page filtered by free-text search and status, kept in the URL. */
export function ResourceListPage<T extends { id: string }>({
  statuses,
  searchLabel,
  scope,
  ...view
}: ResourceListPageProps<T>) {
  const { params, update } = useListParams();
  const list = useApiQuery<Paginated<T>>(
    view.api.list({
      ...scope,
      page: params.page,
      search: params.search || undefined,
      status: statuses.find((status) => status === params.status),
    }),
  );

  return (
    <ResourceListView
      {...view}
      list={list}
      filtered={Boolean(params.search || params.status)}
      onPageChange={(page) => update({ page })}
      filters={
        <ListFilters
          params={params}
          statuses={statuses}
          searchLabel={searchLabel}
          noun={view.noun}
          onChange={update}
        />
      }
    />
  );
}
