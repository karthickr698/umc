import {
  INVOICE_WHATSAPP_STATUSES,
  PAYMENT_MODES,
  PAYMENT_TYPES,
  WORK_ASSIGNMENT_STATUSES,
  WORKER_TYPES,
  type InvoiceWhatsappStatus,
  type PaymentMode,
  type PaymentType,
  type WorkAssignmentStatus,
  type WorkerType,
} from './domain.js';

/** Display names shared by the web UI and generated documents (e.g. invoice PDFs). */
export const PAYMENT_MODE_LABELS: Readonly<Record<PaymentMode, string>> = {
  [PAYMENT_MODES.CASH]: 'Cash',
  [PAYMENT_MODES.UPI]: 'UPI',
  [PAYMENT_MODES.BANK]: 'Bank transfer',
  [PAYMENT_MODES.CHEQUE]: 'Cheque',
  [PAYMENT_MODES.OTHER]: 'Other',
};

export const PAYMENT_TYPE_LABELS: Readonly<Record<PaymentType, string>> = {
  [PAYMENT_TYPES.WORK_PAYMENT]: 'Work payment',
  [PAYMENT_TYPES.ADVANCE]: 'Advance',
  [PAYMENT_TYPES.OTHER]: 'Other',
};

export const WORKER_TYPE_LABELS: Readonly<Record<WorkerType, string>> = {
  [WORKER_TYPES.EMPLOYEE]: 'Employee',
  [WORKER_TYPES.CONTRACTOR_EMPLOYEE]: 'Contractor worker',
};

export const WORK_ASSIGNMENT_STATUS_LABELS: Readonly<Record<WorkAssignmentStatus, string>> = {
  [WORK_ASSIGNMENT_STATUSES.SCHEDULED]: 'Scheduled',
  [WORK_ASSIGNMENT_STATUSES.COMPLETED]: 'Completed',
  [WORK_ASSIGNMENT_STATUSES.CANCELLED]: 'Cancelled',
};

export const INVOICE_WHATSAPP_STATUS_LABELS: Readonly<Record<InvoiceWhatsappStatus, string>> = {
  [INVOICE_WHATSAPP_STATUSES.NOT_SENT]: 'Not sent',
  [INVOICE_WHATSAPP_STATUSES.QUEUED]: 'Sending',
  [INVOICE_WHATSAPP_STATUSES.SENT]: 'Sent',
  [INVOICE_WHATSAPP_STATUSES.DELIVERED]: 'Delivered',
  [INVOICE_WHATSAPP_STATUSES.READ]: 'Read',
  [INVOICE_WHATSAPP_STATUSES.FAILED]: 'Failed',
};
