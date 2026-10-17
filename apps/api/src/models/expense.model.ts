import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  EXPENSE_CATEGORIES,
  FIELD_LIMITS,
  type ExpenseCategory,
  type PaymentMode,
} from '@umc/shared';
import { attachmentsField, type Attachment } from '../utils/attachment-schema.js';
import { calendarDayValidator } from '../utils/calendar-date.js';
import {
  baseSchemaOptions,
  descriptionField,
  moneyAmountField,
  paymentModeField,
} from '../utils/mongoose-schema.js';

/** Money spent on a site that is not a worker payment (materials, transport, equipment, ...). */
export interface Expense {
  companyId: Types.ObjectId;
  siteId: Types.ObjectId;
  category: ExpenseCategory;
  vendorName?: string;
  amount: number;
  /** Calendar day, stored as UTC midnight. */
  expenseDate: Date;
  paymentMode: PaymentMode;
  description?: string;
  /** Bills, receipts and other proof. */
  attachments: Attachment[];
  /** User who recorded the expense. */
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseDocument = HydratedDocument<Expense>;

const expenseSchema = new Schema<Expense>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    category: { type: String, enum: Object.values(EXPENSE_CATEGORIES), required: true },
    vendorName: { type: String, trim: true, maxlength: FIELD_LIMITS.vendorName },
    amount: moneyAmountField,
    expenseDate: { type: Date, required: true, validate: calendarDayValidator },
    paymentMode: paymentModeField,
    description: descriptionField,
    attachments: attachmentsField,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  baseSchemaOptions<Expense>(),
);

// Covers the full list sort, tiebreakers included, so pages are read straight from the index.
expenseSchema.index({ companyId: 1, expenseDate: -1, createdAt: -1, _id: -1 });
expenseSchema.index({ companyId: 1, siteId: 1, expenseDate: -1 });
expenseSchema.index({ companyId: 1, category: 1, expenseDate: -1 });

export const ExpenseModel: Model<Expense> =
  (mongoose.models.Expense as Model<Expense> | undefined) ??
  model<Expense>('Expense', expenseSchema);
