import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { PAYMENT_TYPES, type PaymentMode, type PaymentType, type WorkerType } from '@umc/shared';
import { attachmentsField, type Attachment } from '../utils/attachment-schema.js';
import { calendarDayValidator } from '../utils/calendar-date.js';
import {
  baseSchemaOptions,
  descriptionField,
  moneyAmountField,
  paymentModeField,
  referenceNumberField,
} from '../utils/mongoose-schema.js';
import { validateWorkerIdentity, workerIdentityFields } from '../utils/worker-identity-schema.js';

/**
 * Money paid to one worker. Exactly one worker identity is set, depending on `workerType`:
 * `employeeId` for EMPLOYEE, `contractorId` + `contractorEmployeeId` for CONTRACTOR_EMPLOYEE.
 */
export interface Payment {
  companyId: Types.ObjectId;
  /** Optional: advances and other payments are not always tied to a site. */
  siteId?: Types.ObjectId;
  workerType: WorkerType;
  employeeId?: Types.ObjectId;
  contractorId?: Types.ObjectId;
  contractorEmployeeId?: Types.ObjectId;
  amount: number;
  /** Calendar day, stored as UTC midnight. */
  paymentDate: Date;
  paymentType: PaymentType;
  paymentMode: PaymentMode;
  /** UPI transaction id, cheque number, bank reference, etc. */
  referenceNumber?: string;
  description?: string;
  /** Receipts and other proof of payment. */
  attachments: Attachment[];
  /** User who recorded the payment. */
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<Payment>;

const paymentSchema = new Schema<Payment>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site' },
    ...workerIdentityFields,
    amount: moneyAmountField,
    paymentDate: { type: Date, required: true, validate: calendarDayValidator },
    paymentType: { type: String, enum: Object.values(PAYMENT_TYPES), required: true },
    paymentMode: paymentModeField,
    referenceNumber: referenceNumberField,
    description: descriptionField,
    attachments: attachmentsField,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions<Payment>(),
);

paymentSchema.pre('validate', validateWorkerIdentity);

// Covers the full list sort, tiebreakers included, so pages are read straight from the index.
paymentSchema.index({ companyId: 1, paymentDate: -1, createdAt: -1, _id: -1 });
paymentSchema.index({ companyId: 1, siteId: 1, paymentDate: -1 });
paymentSchema.index({ companyId: 1, employeeId: 1, paymentDate: -1 });
paymentSchema.index({ companyId: 1, contractorId: 1, paymentDate: -1 });
paymentSchema.index({ companyId: 1, contractorEmployeeId: 1, paymentDate: -1 });

export const PaymentModel: Model<Payment> =
  (mongoose.models.Payment as Model<Payment> | undefined) ??
  model<Payment>('Payment', paymentSchema);
