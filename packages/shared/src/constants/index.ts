export const APP_NAME = 'UMC Construction Management';

export const API_PREFIX = '/api';

/** Attachment sub-routes of every resource that supports image attachments. */
const ATTACHMENT_ROUTES = {
  attachments: '/:id/attachments',
  attachmentById: '/:id/attachments/:attachmentId',
} as const;

export const API_ROUTES = {
  health: '/health',
  healthReady: '/health/ready',
  auth: {
    base: '/auth',
    register: '/register',
    login: '/login',
    refresh: '/refresh',
    logout: '/logout',
    me: '/me',
  },
  users: {
    base: '/users',
    list: '/',
    byId: '/:id',
  },
  clients: {
    base: '/clients',
    list: '/',
    byId: '/:id',
  },
  sites: {
    base: '/sites',
    list: '/',
    byId: '/:id',
  },
  employees: {
    base: '/employees',
    list: '/',
    byId: '/:id',
  },
  contractors: {
    base: '/contractors',
    list: '/',
    byId: '/:id',
  },
  contractorEmployees: {
    base: '/contractor-employees',
    list: '/',
    byId: '/:id',
  },
  workAssignments: {
    base: '/work-assignments',
    list: '/',
    byId: '/:id',
    bulk: '/bulk',
    daily: '/daily/:date',
    bySite: '/sites/:siteId',
    byWorker: '/workers/:workerId',
    ...ATTACHMENT_ROUTES,
  },
  payments: {
    base: '/payments',
    list: '/',
    history: '/history',
    byId: '/:id',
    ...ATTACHMENT_ROUTES,
  },
  invoices: {
    base: '/invoices',
    list: '/',
    byId: '/:id',
    /** The PDF, served inline for in-browser viewing. */
    view: '/:id/view',
    /** The PDF, served as a file download. */
    download: '/:id/download',
    regenerate: '/:id/regenerate',
    /** Sends the PDF to the recipient as a WhatsApp document. */
    sendWhatsapp: '/:id/whatsapp',
  },
  /** Public callbacks from third-party providers; each verifies its own signature. */
  webhooks: {
    base: '/webhooks',
    whatsapp: '/whatsapp',
  },
  workerSummaries: {
    base: '/worker-summaries',
    list: '/',
    byWorker: '/:workerId',
  },
  expenses: {
    base: '/expenses',
    list: '/',
    byId: '/:id',
    ...ATTACHMENT_ROUTES,
  },
  clientPayments: {
    base: '/client-payments',
    list: '/',
    summary: '/summary',
    byId: '/:id',
    ...ATTACHMENT_ROUTES,
  },
  dashboard: {
    base: '/dashboard',
    summary: '/summary',
  },
  reports: {
    base: '/reports',
    workerFinancial: '/worker-financial',
    /** The worker financial report as a CSV download. */
    workerFinancialExport: '/worker-financial/export',
    siteFinancial: '/site-financial',
    /** The site financial report as a CSV download. */
    siteFinancialExport: '/site-financial/export',
  },
  /** Cross-company, read-only endpoints for SUPER_ADMIN. */
  admin: {
    base: '/admin',
    companies: '/companies',
    companyById: '/companies/:id',
    sites: '/sites',
    siteById: '/sites/:id',
  },
} as const;

/** Full path of an auth endpoint relative to `API_PREFIX`, e.g. `/auth/login`. */
export function authRoute(route: Exclude<keyof typeof API_ROUTES.auth, 'base'>): string {
  return `${API_ROUTES.auth.base}${API_ROUTES.auth[route]}`;
}

export const AUTH_HEADER_SCHEME = 'Bearer';

/** httpOnly cookie carrying the refresh token; scoped to the auth routes. */
export const REFRESH_TOKEN_COOKIE = 'umc_refresh_token';

export const PASSWORD_LIMITS = {
  min: 8,
  max: 72,
  // bcrypt only uses the first 72 bytes of its input; multi-byte characters count more than once.
  maxBytes: 72,
} as const;

export const PAGINATION = {
  defaultPage: 1,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export const REQUEST_ID_HEADER = 'X-Request-Id';

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  /** Rate limit hit; the `Retry-After` header says how many seconds to wait. */
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  /** WhatsApp sending is not set up on the server; share the document manually instead. */
  WHATSAPP_NOT_CONFIGURED: 'WHATSAPP_NOT_CONFIGURED',
  /** The WhatsApp provider rejected or did not answer the request; `details.retryable` says whether to retry. */
  WHATSAPP_SEND_FAILED: 'WHATSAPP_SEND_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
