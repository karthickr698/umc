import mongoose, { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { COMPANY_STATUSES, FIELD_LIMITS, type Address, type CompanyStatus } from '@umc/shared';
import { EMAIL_PATTERN, addressSchema, baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface Company {
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type CompanyDocument = HydratedDocument<Company>;

const companySchema = new Schema<Company>(
  {
    name: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    phone: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: FIELD_LIMITS.email,
      match: [EMAIL_PATTERN, 'Invalid email address'],
    },
    address: { type: addressSchema },
    status: {
      type: String,
      enum: Object.values(COMPANY_STATUSES),
      default: COMPANY_STATUSES.ACTIVE,
      required: true,
    },
  },
  baseSchemaOptions<Company>(),
);

companySchema.index({ status: 1 });

export const CompanyModel: Model<Company> =
  (mongoose.models.Company as Model<Company> | undefined) ??
  model<Company>('Company', companySchema);
