import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  EMPLOYEE_LIMITS,
  FIELD_LIMITS,
  type ContractorEmployeeStatus,
} from '@umc/shared';
import { baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface ContractorEmployee {
  companyId: Types.ObjectId;
  contractorId: Types.ObjectId;
  name: string;
  phone?: string;
  employeeCode: string;
  dailyRate: number;
  status: ContractorEmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type ContractorEmployeeDocument = HydratedDocument<ContractorEmployee>;

const contractorEmployeeSchema = new Schema<ContractorEmployee>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    contractorId: { type: Schema.Types.ObjectId, ref: 'Contractor', required: true },
    name: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    phone: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: FIELD_LIMITS.code,
    },
    dailyRate: { type: Number, required: true, min: 0, max: EMPLOYEE_LIMITS.maxDailyRate },
    status: {
      type: String,
      enum: Object.values(CONTRACTOR_EMPLOYEE_STATUSES),
      default: CONTRACTOR_EMPLOYEE_STATUSES.ACTIVE,
      required: true,
    },
  },
  baseSchemaOptions<ContractorEmployee>(),
);

contractorEmployeeSchema.index(
  { companyId: 1, contractorId: 1, employeeCode: 1 },
  { unique: true },
);
contractorEmployeeSchema.index({ companyId: 1, contractorId: 1, status: 1, name: 1 });
contractorEmployeeSchema.index({ companyId: 1, status: 1, name: 1 });
contractorEmployeeSchema.index({ companyId: 1, name: 1 });

export const ContractorEmployeeModel: Model<ContractorEmployee> =
  (mongoose.models.ContractorEmployee as Model<ContractorEmployee> | undefined) ??
  model<ContractorEmployee>('ContractorEmployee', contractorEmployeeSchema);
