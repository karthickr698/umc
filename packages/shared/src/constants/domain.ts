export const USER_ROLES = {
  /** Platform operator: belongs to no company and has read-only access to every company. */
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Roles of users who belong to a company; the only roles assignable through user management. */
export const TENANT_USER_ROLES = [
  USER_ROLES.OWNER,
  USER_ROLES.ADMIN,
  USER_ROLES.MANAGER,
  USER_ROLES.STAFF,
] as const satisfies readonly UserRole[];

export type TenantUserRole = (typeof TENANT_USER_ROLES)[number];

export function isTenantUserRole(role: UserRole): role is TenantUserRole {
  return (TENANT_USER_ROLES as readonly UserRole[]).includes(role);
}

export const USER_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type UserStatus = (typeof USER_STATUSES)[keyof typeof USER_STATUSES];

export const COMPANY_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[keyof typeof COMPANY_STATUSES];

export const CLIENT_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ClientStatus = (typeof CLIENT_STATUSES)[keyof typeof CLIENT_STATUSES];

export const SITE_STATUSES = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type SiteStatus = (typeof SITE_STATUSES)[keyof typeof SITE_STATUSES];

export const EMPLOYEE_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[keyof typeof EMPLOYEE_STATUSES];

export const CONTRACTOR_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ContractorStatus = (typeof CONTRACTOR_STATUSES)[keyof typeof CONTRACTOR_STATUSES];

/** Trade a contractor is hired for. */
export const CONTRACTOR_CATEGORIES = {
  ELECTRICIAN: 'ELECTRICIAN',
  PLUMBER: 'PLUMBER',
  TILES: 'TILES',
  CARPENTER: 'CARPENTER',
  PAINTER: 'PAINTER',
  OTHER: 'OTHER',
} as const;

export type ContractorCategory = (typeof CONTRACTOR_CATEGORIES)[keyof typeof CONTRACTOR_CATEGORIES];

export const CONTRACTOR_EMPLOYEE_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type ContractorEmployeeStatus =
  (typeof CONTRACTOR_EMPLOYEE_STATUSES)[keyof typeof CONTRACTOR_EMPLOYEE_STATUSES];

/** Who a work assignment or payment is for: a payroll employee or a contractor-supplied worker. */
export const WORKER_TYPES = {
  EMPLOYEE: 'EMPLOYEE',
  CONTRACTOR_EMPLOYEE: 'CONTRACTOR_EMPLOYEE',
} as const;

export type WorkerType = (typeof WORKER_TYPES)[keyof typeof WORKER_TYPES];

export const WORK_ASSIGNMENT_STATUSES = {
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type WorkAssignmentStatus =
  (typeof WORK_ASSIGNMENT_STATUSES)[keyof typeof WORK_ASSIGNMENT_STATUSES];

/** Statuses that occupy the worker's day; a worker may hold at most one of these per date. */
export const ACTIVE_WORK_ASSIGNMENT_STATUSES = [
  WORK_ASSIGNMENT_STATUSES.SCHEDULED,
  WORK_ASSIGNMENT_STATUSES.COMPLETED,
] as const satisfies readonly WorkAssignmentStatus[];

export function isActiveWorkAssignmentStatus(status: WorkAssignmentStatus): boolean {
  return (ACTIVE_WORK_ASSIGNMENT_STATUSES as readonly WorkAssignmentStatus[]).includes(status);
}

export const WORK_ASSIGNMENT_LIMITS = {
  /** Employees and contractor employees combined. */
  maxBulkWorkers: 100,
} as const;

/** Why one worker of a bulk assignment request was not assigned. */
export const BULK_ASSIGNMENT_FAILURE_REASONS = {
  DUPLICATE_IN_REQUEST: 'DUPLICATE_IN_REQUEST',
  WORKER_NOT_FOUND: 'WORKER_NOT_FOUND',
  ALREADY_ASSIGNED: 'ALREADY_ASSIGNED',
} as const;

export type BulkAssignmentFailureReason =
  (typeof BULK_ASSIGNMENT_FAILURE_REASONS)[keyof typeof BULK_ASSIGNMENT_FAILURE_REASONS];

export const PAYMENT_TYPES = {
  WORK_PAYMENT: 'WORK_PAYMENT',
  ADVANCE: 'ADVANCE',
  OTHER: 'OTHER',
} as const;

export type PaymentType = (typeof PAYMENT_TYPES)[keyof typeof PAYMENT_TYPES];

export const PAYMENT_MODES = {
  CASH: 'CASH',
  UPI: 'UPI',
  BANK: 'BANK',
  CHEQUE: 'CHEQUE',
  OTHER: 'OTHER',
} as const;

export type PaymentMode = (typeof PAYMENT_MODES)[keyof typeof PAYMENT_MODES];

/** Who an invoice is issued to; `paymentId` is the worker payment it documents. */
export const INVOICE_RECIPIENT_TYPES = {
  EMPLOYEE: 'EMPLOYEE',
  CONTRACTOR: 'CONTRACTOR',
  CONTRACTOR_EMPLOYEE: 'CONTRACTOR_EMPLOYEE',
} as const;

export type InvoiceRecipientType =
  (typeof INVOICE_RECIPIENT_TYPES)[keyof typeof INVOICE_RECIPIENT_TYPES];

/**
 * Lifecycle of an invoice document: `PENDING` while its PDF is rendered, `GENERATED` once the
 * PDF is stored, `FAILED` when rendering failed (regenerate to retry).
 */
export const INVOICE_STATUSES = {
  PENDING: 'PENDING',
  GENERATED: 'GENERATED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES];

/** Invoice numbers look like `INV-2026-00042`: prefix, year of the invoice date, sequence. */
export const INVOICE_NUMBER_FORMAT = {
  prefix: 'INV',
  sequenceDigits: 5,
} as const;

/** Site codes are assigned per company as `SITE-0001`, `SITE-0002`, … */
export const SITE_CODE_FORMAT = {
  prefix: 'SITE',
  sequenceDigits: 4,
} as const;

/** Employee codes not given on creation are assigned per company as `EMP-0001`, `EMP-0002`, … */
export const EMPLOYEE_CODE_FORMAT = {
  prefix: 'EMP',
  sequenceDigits: 4,
} as const;

/** Contractor worker codes not given on creation are assigned per contractor as `CW-0001`, … */
export const CONTRACTOR_WORKER_CODE_FORMAT = {
  prefix: 'CW',
  sequenceDigits: 4,
} as const;

export const INVOICE_LIMITS = {
  /** Longest work period whose day-by-day assignments are listed on an invoice. */
  maxWorkPeriodDays: 62,
} as const;

/**
 * Delivery state of the invoice over WhatsApp, ordered by progression: `QUEUED` while it is being
 * sent, `SENT` once the provider accepted it (`sentAt` is set), then `DELIVERED` and `READ` as
 * the provider reports them. `FAILED` can follow any state; sending again retries it.
 */
export const INVOICE_WHATSAPP_STATUSES = {
  NOT_SENT: 'NOT_SENT',
  QUEUED: 'QUEUED',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
} as const;

export type InvoiceWhatsappStatus =
  (typeof INVOICE_WHATSAPP_STATUSES)[keyof typeof INVOICE_WHATSAPP_STATUSES];

/**
 * Payment and expense amounts are stored in the company's currency with at most two decimal
 * places.
 */
export const MONEY_LIMITS = {
  minAmount: 0.01,
  maxAmount: 100_000_000,
  amountStep: 0.01,
} as const;

/**
 * Image formats accepted as attachments (payments, expenses, client payments, work assignments).
 * The API checks the file contents, not just the type the client declares.
 */
export const ATTACHMENT_CONTENT_TYPES = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
} as const;

export type AttachmentContentType =
  (typeof ATTACHMENT_CONTENT_TYPES)[keyof typeof ATTACHMENT_CONTENT_TYPES];

export const ATTACHMENT_LIMITS = {
  /** Per record, across all uploads; also the most files one upload request may carry. */
  maxFilesPerRecord: 10,
  maxFileSizeBytes: 5 * 1024 * 1024,
} as const;

/** Multipart form field that carries the files of an attachment upload. */
export const ATTACHMENT_UPLOAD_FIELD = 'files';

/** What a site expense was spent on. */
export const EXPENSE_CATEGORIES = {
  MATERIAL: 'MATERIAL',
  TRANSPORT: 'TRANSPORT',
  EQUIPMENT: 'EQUIPMENT',
  LABOUR: 'LABOUR',
  OTHER: 'OTHER',
} as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[keyof typeof EXPENSE_CATEGORIES];

/** Money in from a client, or money out to an own employee, a contractor, or on a site expense. */
export const TRANSACTION_KINDS = {
  CLIENT_PAYMENT: 'CLIENT_PAYMENT',
  WORKER_PAYMENT: 'WORKER_PAYMENT',
  CONTRACTOR_PAYMENT: 'CONTRACTOR_PAYMENT',
  EXPENSE: 'EXPENSE',
} as const;

export type TransactionKind = (typeof TRANSACTION_KINDS)[keyof typeof TRANSACTION_KINDS];

/** Bucket size of the dashboard money trend. */
export const TREND_INTERVALS = {
  DAY: 'DAY',
  MONTH: 'MONTH',
} as const;

export type TrendInterval = (typeof TREND_INTERVALS)[keyof typeof TREND_INTERVALS];

export const DASHBOARD_LIMITS = {
  recentTransactions: 10,
  /** Date ranges up to this many days are trended per day; longer or open ranges per month. */
  maxDailyTrendDays: 92,
} as const;

/**
 * Daily rates (employees and contractor employees) are stored in the company's currency with at
 * most two decimal places.
 */
export const EMPLOYEE_LIMITS = {
  maxDailyRate: 1_000_000,
  dailyRateStep: 0.01,
} as const;

/** Site and employee codes, after upper-casing: letters, digits, `-` and `_`. */
export const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]*$/;

/** Max lengths shared by API validation and web form validation. */
export const FIELD_LIMITS = {
  name: 120,
  code: 32,
  jobRole: 80,
  workType: 80,
  notes: 2000,
  description: 2000,
  referenceNumber: 64,
  invoiceNumber: 32,
  url: 2048,
  vendorName: 120,
  fileName: 255,
  search: 100,
  email: 254,
  phone: 32,
  addressLine: 200,
  city: 100,
  state: 100,
  postalCode: 20,
  country: 100,
} as const;
