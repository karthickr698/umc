import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import type { PaymentMode } from '@umc/shared';
import { attachmentsField, type Attachment } from '../utils/attachment-schema.js';
import { calendarDayValidator } from '../utils/calendar-date.js';
import {
  baseSchemaOptions,
  descriptionField,
  moneyAmountField,
  paymentModeField,
  referenceNumberField,
} from '../utils/mongoose-schema.js';

/** Money received from a client. When `siteId` is set, that site belongs to `clientId`. */
export interface ClientPayment {
  companyId: Types.ObjectId;
  /** Optional: retainers and other receipts are not always tied to a site. */
  siteId?: Types.ObjectId;
  clientId: Types.ObjectId;
  amount: number;
  /** Calendar day, stored as UTC midnight. */
  receivedDate: Date;
  paymentMode: PaymentMode;
  referenceNumber?: string;
  description?: string;
  /** Receipts and other proof of payment. */
  attachments: Attachment[];
  /** User who recorded the receipt. */
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientPaymentDocument = HydratedDocument<ClientPayment>;

const clientPaymentSchema = new Schema<ClientPayment>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    amount: moneyAmountField,
    receivedDate: { type: Date, required: true, validate: calendarDayValidator },
    paymentMode: paymentModeField,
    referenceNumber: referenceNumberField,
    description: descriptionField,
    attachments: attachmentsField,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions<ClientPayment>(),
);

// Covers the full list sort, tiebreakers included, so pages are read straight from the index.
clientPaymentSchema.index({ companyId: 1, receivedDate: -1, createdAt: -1, _id: -1 });
clientPaymentSchema.index({ companyId: 1, clientId: 1, receivedDate: -1 });
clientPaymentSchema.index({ companyId: 1, siteId: 1, receivedDate: -1 });
clientPaymentSchema.index({ companyId: 1, paymentMode: 1, receivedDate: -1 });

export const ClientPaymentModel: Model<ClientPayment> =
  (mongoose.models.ClientPayment as Model<ClientPayment> | undefined) ??
  model<ClientPayment>('ClientPayment', clientPaymentSchema);
