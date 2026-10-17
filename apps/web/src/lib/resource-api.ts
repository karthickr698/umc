import { API_ROUTES } from '@umc/shared';
import { withQuery } from '@/utils/query-string';
import { apiRequest } from './api-client';

type QueryParams = Readonly<Record<string, string | number | undefined>>;

/** Paths of a company-scoped REST resource with list, create, read, update and delete. */
export interface ResourceApi {
  /** The list and create endpoint. */
  base: string;
  list: (query: QueryParams) => string;
  byId: (id: string) => string;
}

function resourceApi(routes: { base: string; byId: string }): ResourceApi {
  return {
    base: routes.base,
    list: (query) => withQuery(routes.base, query),
    byId: (id) => `${routes.base}${routes.byId.replace(':id', encodeURIComponent(id))}`,
  };
}

/** API paths of the records managed from their own list pages, relative to the API base URL. */
export const RESOURCE_API = {
  clients: resourceApi(API_ROUTES.clients),
  sites: resourceApi(API_ROUTES.sites),
  employees: resourceApi(API_ROUTES.employees),
  contractors: resourceApi(API_ROUTES.contractors),
  contractorEmployees: resourceApi(API_ROUTES.contractorEmployees),
  expenses: resourceApi(API_ROUTES.expenses),
  clientPayments: resourceApi(API_ROUTES.clientPayments),
} as const;

export function createResource<T>(api: ResourceApi, body: object): Promise<T> {
  return apiRequest<T>(api.base, { method: 'POST', body: JSON.stringify(body) });
}

/**
 * PATCHes only `changes`. The API rejects empty updates, so when nothing changed `current` is
 * returned without a request.
 */
export function updateResource<T>(
  api: ResourceApi,
  current: T & { id: string },
  changes: object,
): Promise<T> {
  if (Object.keys(changes).length === 0) return Promise.resolve(current);
  return apiRequest<T>(api.byId(current.id), { method: 'PATCH', body: JSON.stringify(changes) });
}

export function deleteResource(api: ResourceApi, id: string): Promise<void> {
  return apiRequest<void>(api.byId(id), { method: 'DELETE' });
}
