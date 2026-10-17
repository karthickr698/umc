import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  FIELD_LIMITS,
  INVOICE_RECIPIENT_TYPES,
  INVOICE_STATUSES,
  INVOICE_WHATSAPP_STATUSES,
  type InvoiceRecipientType,
  type InvoiceStatus,
  type InvoiceWhatsappStatus,
} from '@umc/shared';
import { calendarDayValidator } from '../utils/calendar-date.js';
import { baseSchemaOptions, descriptionField, moneyAmountField } from '../utils/mongoose-schema.js';

/** Inclusive range of calendar days, each stored as UTC midnight. */
export interface InvoiceWorkPeriod {
  from: Date;
  to: Date;
}

/**
 * Invoice issued for one payment (at most one per payment). Recipient details are snapshotted
 * when the PDF is (re)generated so the invoice stays unchanged if the worker or contractor is
 * later edited.
 */
export interface Invoice {
  companyId: Types.ObjectId;
  /** Unique within the company. */
  invoiceNumber: string;
  paymentId: Types.ObjectId;
  recipientType: InvoiceRecipientType;
  recipientName: string;
  /** WhatsApp destination; optional because not every recipient has a phone on file. */
  recipientPhone?: string;
  /** Optional: copied from the payment, which is not always tied to a site. */
  siteId?: Types.ObjectId;
  amount: number;
  /** Calendar day, stored as UTC midnight. */
  invoiceDate: Date;
  workPeriod?: InvoiceWorkPeriod;
  workDetails?: string;
  notes?: string;
  /** Storage key of the PDF; set once it has been generated. URLs are resolved on demand. */
  pdfKey?: string;
  /** When the current PDF was rendered. */
  generatedAt?: Date;
  status: InvoiceStatus;
  whatsappStatus: InvoiceWhatsappStatus;
  /** Provider id of the last WhatsApp message; delivery webhooks are matched on it. */
  whatsappMessageId?: string;
  /** Number the last WhatsApp message went to, digits only with country code. */
  whatsappRecipient?: string;
  /** User-facing reason of the last failure; set only while `whatsappStatus` is FAILED. */
  whatsappError?: string;
  /** When `whatsappStatus` last changed. */
  whatsappStatusAt?: Date;
  /** When the invoice was sent over WhatsApp. */
  sentAt?: Date;
  /** User who issued the invoice. */
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceDocument = HydratedDocument<Invoice>;

const workPeriodSchema = new Schema<InvoiceWorkPeriod>(
  {
    from: { type: Date, required: true, validate: calendarDayValidator },
    to: { type: Date, required: true, validate: calendarDayValidator },
  },
  { _id: false },
);

const invoiceSchema = new Schema<Invoice>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: FIELD_LIMITS.invoiceNumber,
    },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    recipientType: { type: String, enum: Object.values(INVOICE_RECIPIENT_TYPES), required: true },
    recipientName: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    recipientPhone: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    amount: moneyAmountField,
    invoiceDate: { type: Date, required: true, validate: calendarDayValidator },
    workPeriod: { type: workPeriodSchema },
    workDetails: descriptionField,
    notes: { type: String, trim: true, maxlength: FIELD_LIMITS.notes },
    pdfKey: { type: String, trim: true, maxlength: FIELD_LIMITS.url },
    generatedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUSES),
      default: INVOICE_STATUSES.PENDING,
      required: true,
    },
    whatsappStatus: {
      type: String,
      enum: Object.values(INVOICE_WHATSAPP_STATUSES),
      default: INVOICE_WHATSAPP_STATUSES.NOT_SENT,
      required: true,
    },
    whatsappMessageId: { type: String, trim: true, maxlength: FIELD_LIMITS.url },
    whatsappRecipient: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    whatsappError: { type: String, trim: true, maxlength: FIELD_LIMITS.notes },
    whatsappStatusAt: { type: Date },
    sentAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions<Invoice>(),
);

invoiceSchema.index({ companyId: 1, invoiceNumber: 1 }, { unique: true });
// Covers the full list sort, tiebreakers included, so pages are read straight from the index.
invoiceSchema.index({ companyId: 1, invoiceDate: -1, createdAt: -1, _id: -1 });
invoiceSchema.index({ companyId: 1, paymentId: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, siteId: 1, invoiceDate: -1 });
invoiceSchema.index({ companyId: 1, status: 1, invoiceDate: -1 });
invoiceSchema.index({ companyId: 1, whatsappStatus: 1 });
invoiceSchema.index({ whatsappMessageId: 1 }, { sparse: true });

export const InvoiceModel: Model<Invoice> =
  (mongoose.models.Invoice as Model<Invoice> | undefined) ??
  model<Invoice>('Invoice', invoiceSchema);
