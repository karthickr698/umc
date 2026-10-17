import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  CONTRACTOR_CATEGORIES,
  CONTRACTOR_STATUSES,
  FIELD_LIMITS,
  type Address,
  type ContractorCategory,
  type ContractorStatus,
} from '@umc/shared';
import { EMAIL_PATTERN, addressSchema, baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface Contractor {
  companyId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  category: ContractorCategory;
  address?: Address;
  status: ContractorStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContractorDocument = HydratedDocument<Contractor>;

const contractorSchema = new Schema<Contractor>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    phone: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: FIELD_LIMITS.email,
      match: [EMAIL_PATTERN, 'Invalid email address'],
    },
    category: {
      type: String,
      enum: Object.values(CONTRACTOR_CATEGORIES),
      required: true,
    },
    address: { type: addressSchema },
    status: {
      type: String,
      enum: Object.values(CONTRACTOR_STATUSES),
      default: CONTRACTOR_STATUSES.ACTIVE,
      required: true,
    },
    notes: { type: String, trim: true, maxlength: FIELD_LIMITS.notes },
  },
  baseSchemaOptions<Contractor>(),
);

contractorSchema.index({ companyId: 1, name: 1 });
contractorSchema.index({ companyId: 1, status: 1 });
contractorSchema.index({ companyId: 1, category: 1 });

export const ContractorModel: Model<Contractor> =
  (mongoose.models.Contractor as Model<Contractor> | undefined) ??
  model<Contractor>('Contractor', contractorSchema);
