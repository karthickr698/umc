/** Client-side page paths. API paths live in `API_ROUTES` from `@umc/shared`. */
export const APP_ROUTES = {
  login: '/login',
  register: '/register',
  dashboard: '/',
  sites: '/sites',
  clients: '/clients',
  employees: '/employees',
  contractors: '/contractors',
  contractorWorkers: '/contractors/:contractorId',
  workAllocation: '/work-allocation',
  workSchedule: '/work-schedule',
  payments: '/payments',
  paymentEntry: '/payments/new',
  expenses: '/expenses',
  clientPayments: '/client-payments',
  reports: '/reports',
  siteReport: '/reports/sites',
  settings: '/settings',
  adminCompanies: '/admin/companies',
  adminCompanyDetail: '/admin/companies/:companyId',
  adminSites: '/admin/sites',
  adminSiteDetail: '/admin/sites/:siteId',
} as const;

export function contractorWorkersPath(contractorId: string): string {
  return APP_ROUTES.contractorWorkers.replace(':contractorId', encodeURIComponent(contractorId));
}

export function adminCompanyPath(companyId: string): string {
  return APP_ROUTES.adminCompanyDetail.replace(':companyId', encodeURIComponent(companyId));
}

export function adminSitePath(siteId: string): string {
  return APP_ROUTES.adminSiteDetail.replace(':siteId', encodeURIComponent(siteId));
}

export type AppRouteKey = keyof typeof APP_ROUTES;
