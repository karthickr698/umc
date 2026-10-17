import mongoose, { Schema, model, type HydratedDocument, type Model, type Types } from 'mongoose';
import {
  ACTIVE_WORK_ASSIGNMENT_STATUSES,
  EMPLOYEE_LIMITS,
  FIELD_LIMITS,
  WORK_ASSIGNMENT_STATUSES,
  type WorkAssignmentStatus,
  type WorkerType,
} from '@umc/shared';
import { attachmentsField, type Attachment } from '../utils/attachment-schema.js';
import { calendarDayValidator } from '../utils/calendar-date.js';
import { baseSchemaOptions } from '../utils/mongoose-schema.js';
import { validateWorkerIdentity, workerIdentityFields } from '../utils/worker-identity-schema.js';

/**
 * Where one worker works on one calendar day. Exactly one worker identity is set, depending on
 * `workerType`: `employeeId` for EMPLOYEE, `contractorId` + `contractorEmployeeId` for
 * CONTRACTOR_EMPLOYEE.
 */
export interface WorkAssignment {
  companyId: Types.ObjectId;
  siteId: Types.ObjectId;
  workerType: WorkerType;
  employeeId?: Types.ObjectId;
  contractorId?: Types.ObjectId;
  contractorEmployeeId?: Types.ObjectId;
  /** Calendar day, stored as UTC midnight. */
  date: Date;
  workType: string;
  /** Snapshot of the worker's rate for this day; later rate changes don't affect it. */
  dailyRate: number;
  status: WorkAssignmentStatus;
  notes?: string;
  /** Site photos and other proof of work. */
  attachments: Attachment[];
  createdAt: Date;
  updatedAt: Date;
}

export type WorkAssignmentDocument = HydratedDocument<WorkAssignment>;

const workAssignmentSchema = new Schema<WorkAssignment>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    siteId: { type: Schema.Types.ObjectId, ref: 'Site', required: true },
    ...workerIdentityFields,
    date: { type: Date, required: true, validate: calendarDayValidator },
    workType: { type: String, required: true, trim: true, maxlength: FIELD_LIMITS.workType },
    dailyRate: { type: Number, required: true, min: 0, max: EMPLOYEE_LIMITS.maxDailyRate },
    status: {
      type: String,
      enum: Object.values(WORK_ASSIGNMENT_STATUSES),
      default: WORK_ASSIGNMENT_STATUSES.SCHEDULED,
      required: true,
    },
    notes: { type: String, trim: true, maxlength: FIELD_LIMITS.notes },
    attachments: attachmentsField,
  },
  baseSchemaOptions<WorkAssignment>(),
);

workAssignmentSchema.pre('validate', validateWorkerIdentity);

workAssignmentSchema.index({ companyId: 1, date: 1 });
workAssignmentSchema.index({ companyId: 1, siteId: 1, date: 1 });
workAssignmentSchema.index({ companyId: 1, employeeId: 1, date: 1 });
workAssignmentSchema.index({ companyId: 1, contractorEmployeeId: 1, date: 1 });

// A worker holds at most one active assignment per day. The service checks this first to return a
// friendly error; these indexes close the race between concurrent requests.
const activeStatuses = { $in: [...ACTIVE_WORK_ASSIGNMENT_STATUSES] };
workAssignmentSchema.index(
  { companyId: 1, employeeId: 1, date: 1 },
  {
    name: 'unique_active_employee_per_day',
    unique: true,
    partialFilterExpression: { employeeId: { $exists: true }, status: activeStatuses },
  },
);
workAssignmentSchema.index(
  { companyId: 1, contractorEmployeeId: 1, date: 1 },
  {
    name: 'unique_active_contractor_employee_per_day',
    unique: true,
    partialFilterExpression: { contractorEmployeeId: { $exists: true }, status: activeStatuses },
  },
);

export const WorkAssignmentModel: Model<WorkAssignment> =
  (mongoose.models.WorkAssignment as Model<WorkAssignment> | undefined) ??
  model<WorkAssignment>('WorkAssignment', workAssignmentSchema);
