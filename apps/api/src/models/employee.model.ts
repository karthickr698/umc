import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import { EMPLOYEE_LIMITS, EMPLOYEE_STATUSES, FIELD_LIMITS, type EmployeeStatus } from '@umc/shared';
import { baseSchemaOptions } from '../utils/mongoose-schema.js';

export interface Employee {
  companyId: Types.ObjectId;
  name: string;
  phone?: string;
  employeeCode: string;
  role: string;
  dailyRate: number;
  status: EmployeeStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type EmployeeDocument = HydratedDocument<Employee>;

const employeeSchema = new Schema<Employee>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.name },
    phone: { type: String, trim: true, maxlength: FIELD_LIMITS.phone },
    employeeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: FIELD_LIMITS.code,
    },
    role: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.jobRole },
    dailyRate: { type: Number, required: true, min: 0, max: EMPLOYEE_LIMITS.maxDailyRate },
    status: {
      type: String,
      enum: Object.values(EMPLOYEE_STATUSES),
      default: EMPLOYEE_STATUSES.ACTIVE,
      required: true,
    },
    notes: { type: String, trim: true, maxlength: FIELD_LIMITS.notes },
  },
  baseSchemaOptions<Employee>(),
);

employeeSchema.index({ companyId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, status: 1, name: 1 });
employeeSchema.index({ companyId: 1, name: 1 });

export const EmployeeModel: Model<Employee> =
  (mongoose.models.Employee as Model<Employee> | undefined) ??
  model<Employee>('Employee', employeeSchema);
