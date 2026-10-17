import type {
  ClientStatus,
  CompanyStatus,
  ContractorCategory,
  ContractorEmployeeStatus,
  ContractorStatus,
  EmployeeStatus,
  ExpenseCategory,
  InvoiceRecipientType,
  InvoiceStatus,
  InvoiceWhatsappStatus,
  PaymentMode,
  PaymentType,
  SiteStatus,
  UserRole,
  UserStatus,
  WorkAssignmentStatus,
  WorkerType,
} from '../constants/domain.js';
import type { AttachmentDto } from './attachment.js';

export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

/** Timestamps are ISO-8601 strings once serialised. */
export interface CompanyDto {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
  status: CompanyStatus;
  createdAt: string;
  updatedAt: string;
}

/** Never carries the password hash. */
export interface UserDto {
  id: string;
  /** `null` only for SUPER_ADMIN, who belongs to no company. */
  companyId: string | null;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

/** A user who belongs to a company; every company-scoped operation acts as one. */
export type TenantUserDto = UserDto & { companyId: string };

export interface ClientDto {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SiteDto {
  id: string;
  companyId: string;
  clientId: string;
  name: string;
  code: string;
  address?: Address;
  status: SiteStatus;
  /** ISO-8601 timestamp. */
  startDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** A worker on the builder's payroll; not a login account (see `UserDto`). */
export interface EmployeeDto {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  employeeCode: string;
  /** Job role or trade, e.g. "Mason". */
  role: string;
  dailyRate: number;
  status: EmployeeStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** An external firm or tradesperson hired per job; not on payroll (see `EmployeeDto`). */
export interface ContractorDto {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  email?: string;
  category: ContractorCategory;
  address?: Address;
  status: ContractorStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** A worker supplied by a contractor; paid via the contractor, not on payroll (see `EmployeeDto`). */
export interface ContractorEmployeeDto {
  id: string;
  companyId: string;
  contractorId: string;
  name: string;
  phone?: string;
  employeeCode: string;
  dailyRate: number;
  status: ContractorEmployeeStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Where one worker works on one calendar day. `employeeId` is set for EMPLOYEE assignments;
 * `contractorId` and `contractorEmployeeId` for CONTRACTOR_EMPLOYEE assignments.
 */
export interface WorkAssignmentDto {
  id: string;
  companyId: string;
  siteId: string;
  workerType: WorkerType;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  /** Calendar day, `YYYY-MM-DD`. */
  date: string;
  workType: string;
  /** The worker's rate snapshotted for this day. */
  dailyRate: number;
  status: WorkAssignmentStatus;
  notes?: string;
  /** Oldest first; managed through the assignment's attachment endpoints. */
  attachments: AttachmentDto[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Money paid to one worker. `employeeId` is set for EMPLOYEE payments; `contractorId` and
 * `contractorEmployeeId` for CONTRACTOR_EMPLOYEE payments.
 */
export interface PaymentDto {
  id: string;
  companyId: string;
  /** Absent for payments not tied to a site (e.g. some advances). */
  siteId?: string;
  workerType: WorkerType;
  employeeId?: string;
  contractorId?: string;
  contractorEmployeeId?: string;
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  paymentDate: string;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  description?: string;
  /** Oldest first; managed through the payment's attachment endpoints. */
  attachments: AttachmentDto[];
  /** User who recorded the payment. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Inclusive range of calendar days, `YYYY-MM-DD`. */
export interface CalendarDateRange {
  from: string;
  to: string;
}

/**
 * Receipt issued for one worker payment. Recipient, site and amount are snapshotted when the PDF
 * is (re)generated, so later edits to the payment or worker do not change an issued invoice.
 */
export interface InvoiceDto {
  id: string;
  companyId: string;
  /** Unique within the company, e.g. `INV-2026-00042`. */
  invoiceNumber: string;
  paymentId: string;
  recipientType: InvoiceRecipientType;
  recipientName: string;
  recipientPhone?: string;
  siteId?: string;
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  invoiceDate: string;
  /** Period whose work assignments are listed on the invoice. */
  workPeriod?: CalendarDateRange;
  workDetails?: string;
  notes?: string;
  status: InvoiceStatus;
  whatsappStatus: InvoiceWhatsappStatus;
  /** Number the last WhatsApp message went to, digits only with country code. */
  whatsappRecipient?: string;
  /** User-facing reason of the last failed WhatsApp send or delivery; set while `FAILED`. */
  whatsappError?: string;
  /** When `whatsappStatus` last changed. */
  whatsappStatusAt?: string;
  sentAt?: string;
  /** When the current PDF was rendered; fetch it through the invoice view/download endpoints. */
  generatedAt?: string;
  /** User who issued the invoice. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Money received from a client; when `siteId` is set, that site belongs to the client. */
export interface ClientPaymentDto {
  id: string;
  companyId: string;
  clientId: string;
  /** Absent for receipts not tied to a site (e.g. an upfront retainer). */
  siteId?: string;
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  receivedDate: string;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  description?: string;
  /** Oldest first; managed through the receipt's attachment endpoints. */
  attachments: AttachmentDto[];
  /** User who recorded the receipt. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Money spent on a site that is not a worker payment (materials, transport, equipment, ...). */
export interface ExpenseDto {
  id: string;
  companyId: string;
  siteId: string;
  category: ExpenseCategory;
  vendorName?: string;
  amount: number;
  /** Calendar day, `YYYY-MM-DD`. */
  expenseDate: string;
  paymentMode: PaymentMode;
  description?: string;
  /** Oldest first; managed through the expense's attachment endpoints. */
  attachments: AttachmentDto[];
  /** User who recorded the expense. */
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
