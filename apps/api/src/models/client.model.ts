import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { CLIENT_STATUSES, FIELD_LIMITS, type Address, type ClientStatus } from '@umc/shared';
import { EMAIL_PATTERN, addressSchema, baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface Client {
  companyId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  address?: Address;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ClientDocument = HydratedDocument<Client>;

const clientSchema = new Schema<Client>(
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
    address: { type: addressSchema },
    status: {
      type: String,
      enum: Object.values(CLIENT_STATUSES),
      default: CLIENT_STATUSES.ACTIVE,
      required: true,
    },
  },
  baseSchemaOptions<Client>(),
);

clientSchema.index({ companyId: 1, name: 1 });
clientSchema.index({ companyId: 1, status: 1 });

export const ClientModel: Model<Client> =
  (mongoose.models.Client as Model<Client> | undefined) ?? model<Client>('Client', clientSchema);
