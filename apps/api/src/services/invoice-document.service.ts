import {
  INVOICE_RECIPIENT_TYPES,
  PAYMENT_MODE_LABELS,
  PAYMENT_TYPE_LABELS,
  WORK_ASSIGNMENT_STATUS_LABELS,
  WORKER_TYPE_LABELS,
  WORKER_TYPES,
  formatAddress,
  type InvoiceRecipientType,
  type WorkerType,
} from '@umc/shared';
import { renderPdf } from '../lib/pdf/pdf-renderer.js';
import * as companyRepository from '../repositories/company.repository.js';
import type { CompanyRecord } from '../repositories/company.repository.js';
import * as contractorEmployeeRepository from '../repositories/contractor-employee.repository.js';
import * as contractorRepository from '../repositories/contractor.repository.js';
import * as employeeRepository from '../repositories/employee.repository.js';
import type { InvoiceRecord } from '../repositories/invoice.repository.js';
import type { PaymentRecord } from '../repositories/payment.repository.js';
import * as siteRepository from '../repositories/site.repository.js';
import type { SiteRecord } from '../repositories/site.repository.js';
import * as workAssignmentRepository from '../repositories/work-assignment.repository.js';
import {
  renderInvoiceReceiptFooter,
  renderInvoiceReceiptHtml,
  type InvoiceReceiptView,
  type InvoiceReceiptWorkDay,
} from '../templates/invoice-receipt/invoice-receipt.template.js';
import { ApiError } from '../utils/api-error.js';
import { toCalendarDate } from '../utils/calendar-date.js';
import type { WorkerRef } from '../utils/worker-ref.js';
import { workerRefOf } from './worker.service.js';

const RECIPIENT_TYPE_BY_WORKER_TYPE: Readonly<Record<WorkerType, InvoiceRecipientType>> = {
  [WORKER_TYPES.EMPLOYEE]: INVOICE_RECIPIENT_TYPES.EMPLOYEE,
  [WORKER_TYPES.CONTRACTOR_EMPLOYEE]: INVOICE_RECIPIENT_TYPES.CONTRACTOR_EMPLOYEE,
};

interface InvoiceRecipient {
  type: InvoiceRecipientType;
  worker: WorkerRef;
  name: string;
  code: string;
  phone?: string;
  role?: string;
  contractorName?: string;
}

/** The live records an invoice for a payment is built from. */
export interface InvoiceContext {
  company: CompanyRecord;
  site?: SiteRecord;
  recipient: InvoiceRecipient;
}

// Payments keep their worker and site from being deleted, so a missing one means the data
// changed underneath the payment; report it instead of printing a half-empty receipt.
function missing(what: string): ApiError {
  return ApiError.conflict(`The payment's ${what} no longer exists`);
}

async function loadRecipient(companyId: string, payment: PaymentRecord): Promise<InvoiceRecipient> {
  const worker = workerRefOf(payment);
  const type = RECIPIENT_TYPE_BY_WORKER_TYPE[payment.workerType];

  if (worker.workerType === WORKER_TYPES.EMPLOYEE) {
    const employee = await employeeRepository.findByIdInCompany(companyId, worker.workerId);
    if (!employee) throw missing('employee');
    return {
      type,
      worker,
      name: employee.name,
      code: employee.employeeCode,
      role: employee.role,
      ...(employee.phone && { phone: employee.phone }),
    };
  }

  const employee = await contractorEmployeeRepository.findByIdInCompany(companyId, worker.workerId);
  if (!employee) throw missing('contractor employee');
  const contractor = await contractorRepository.findByIdInCompany(
    companyId,
    employee.contractorId.toString(),
  );
  if (!contractor) throw missing('contractor');
  const phone = employee.phone || contractor.phone;
  return {
    type,
    worker,
    name: employee.name,
    code: employee.employeeCode,
    contractorName: contractor.name,
    ...(phone && { phone }),
  };
}

export async function loadInvoiceContext(
  companyId: string,
  payment: PaymentRecord,
): Promise<InvoiceContext> {
  const siteId = payment.siteId?.toString();
  const [company, site, recipient] = await Promise.all([
    companyRepository.findById(companyId),
    siteId ? siteRepository.findByIdInCompany(companyId, siteId) : undefined,
    loadRecipient(companyId, payment),
  ]);
  if (!company) throw ApiError.notFound('Company not found');
  if (siteId && !site) throw missing('site');
  return { company, recipient, ...(site && { site }) };
}

/** Recipient fields stored on the invoice; `phone` is `undefined` when none is on file. */
export function recipientSnapshot({ recipient }: InvoiceContext) {
  return {
    recipientType: recipient.type,
    recipientName: recipient.name,
    recipientPhone: recipient.phone,
  };
}

async function loadWorkDays(
  companyId: string,
  invoice: InvoiceRecord,
  context: InvoiceContext,
): Promise<InvoiceReceiptWorkDay[]> {
  if (!invoice.workPeriod) return [];
  const siteId = context.site?._id.toString();
  const assignments = await workAssignmentRepository.listActiveForWorkerInRange(
    companyId,
    context.recipient.worker,
    { ...invoice.workPeriod, ...(siteId && { siteId }) },
  );
  // Only an invoice without a site can span several, so only then is each day's site shown.
  const siteNames = siteId
    ? undefined
    : await siteRepository.findNamesByIdsInCompany(companyId, [
        ...new Set(assignments.map((assignment) => assignment.siteId.toString())),
      ]);
  return assignments.map((assignment) => ({
    date: toCalendarDate(assignment.date),
    workType: assignment.workType,
    statusLabel: WORK_ASSIGNMENT_STATUS_LABELS[assignment.status],
    dailyRate: assignment.dailyRate,
    ...(siteNames && { siteName: siteNames.get(assignment.siteId.toString()) ?? 'Unknown site' }),
  }));
}

async function buildView(
  companyId: string,
  invoice: InvoiceRecord,
  payment: PaymentRecord,
  context: InvoiceContext,
  generatedAt: Date,
): Promise<InvoiceReceiptView> {
  const { company, site, recipient } = context;
  const companyAddress = formatAddress(company.address);
  const siteAddress = formatAddress(site?.address);
  const workDays = await loadWorkDays(companyId, invoice, context);

  return {
    company: {
      name: company.name,
      ...(company.phone && { phone: company.phone }),
      ...(company.email && { email: company.email }),
      ...(companyAddress && { address: companyAddress }),
    },
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: toCalendarDate(invoice.invoiceDate),
    recipient: {
      name: recipient.name,
      code: recipient.code,
      typeLabel: WORKER_TYPE_LABELS[payment.workerType],
      ...(recipient.role && { role: recipient.role }),
      ...(recipient.phone && { phone: recipient.phone }),
      ...(recipient.contractorName && { contractorName: recipient.contractorName }),
    },
    ...(site && {
      site: { name: site.name, code: site.code, ...(siteAddress && { address: siteAddress }) },
    }),
    payment: {
      date: toCalendarDate(payment.paymentDate),
      typeLabel: PAYMENT_TYPE_LABELS[payment.paymentType],
      modeLabel: PAYMENT_MODE_LABELS[payment.paymentMode],
      amount: invoice.amount,
      ...(payment.referenceNumber && { referenceNumber: payment.referenceNumber }),
    },
    ...(invoice.workDetails && { workDetails: invoice.workDetails }),
    ...(invoice.workPeriod && {
      workPeriod: {
        from: toCalendarDate(invoice.workPeriod.from),
        to: toCalendarDate(invoice.workPeriod.to),
        days: workDays,
      },
    }),
    ...(invoice.notes && { notes: invoice.notes }),
    generatedAt,
  };
}

/** Renders the receipt PDF of an invoice from its stored snapshot and the payment's records. */
export async function renderInvoicePdf(
  companyId: string,
  invoice: InvoiceRecord,
  payment: PaymentRecord,
  context: InvoiceContext,
  generatedAt: Date,
): Promise<Uint8Array> {
  const view = await buildView(companyId, invoice, payment, context, generatedAt);
  return renderPdf(renderInvoiceReceiptHtml(view), {
    footerTemplate: renderInvoiceReceiptFooter(view),
  });
}
