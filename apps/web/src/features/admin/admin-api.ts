import { API_ROUTES, type AdminListCompaniesQuery, type AdminListSitesQuery } from '@umc/shared';
import { withQuery } from '@/utils/query-string';

const { admin } = API_ROUTES;

/** API paths of the SUPER_ADMIN endpoints, relative to the API base URL. */
export const ADMIN_API = {
  companies: (query: AdminListCompaniesQuery) =>
    withQuery(`${admin.base}${admin.companies}`, { ...query }),
  company: (id: string) =>
    `${admin.base}${admin.companyById.replace(':id', encodeURIComponent(id))}`,
  sites: (query: AdminListSitesQuery) => withQuery(`${admin.base}${admin.sites}`, { ...query }),
  site: (id: string) => `${admin.base}${admin.siteById.replace(':id', encodeURIComponent(id))}`,
};
