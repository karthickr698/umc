import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { FIELD_LIMITS, SITE_STATUSES, type Address, type SiteStatus } from '@umc/shared';
import { addressSchema, baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface Site {
  companyId: Types.ObjectId;
  clientId: Types.ObjectId;
  name: string;
  code: string;
  address?: Address;
  status: SiteStatus;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SiteDocument = HydratedDocument<Site>;

const siteSchema = new Schema<Site>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: FIELD_LIMITS.code,
    },
    address: { type: addressSchema },
    status: {
      type: String,
      enum: Object.values(SITE_STATUSES),
      default: SITE_STATUSES.PLANNED,
      required: true,
    },
    startDate: { type: Date },
  },
  baseSchemaOptions<Site>(),
);

siteSchema.index({ companyId: 1, code: 1 }, { unique: true });
siteSchema.index({ companyId: 1, clientId: 1 });
siteSchema.index({ companyId: 1, status: 1 });
siteSchema.index({ companyId: 1, name: 1 });

export const SiteModel: Model<Site> =
  (mongoose.models.Site as Model<Site> | undefined) ?? model<Site>('Site', siteSchema);
