import { z } from 'zod';
import {
  EMPLOYEE_STATUSES,
  FIELD_LIMITS,
  type CreateEmployeeRequest,
  type UpdateEmployeeRequest,
} from '@umc/shared';
import {
  codeSchema,
  dailyRateSchema,
  nameSchema,
  notesSchema,
  paginationQuerySchema,
  phoneSchema,
  requireAnyField,
  searchQuerySchema,
} from './common.validator.js';

const jobRoleSchema = z.string().trim().min(1, 'Role is required').max(FIELD_LIMITS.jobRole);

export const createEmployeeSchema = z.strictObject({
  name: nameSchema,
  phone: phoneSchema.optional(),
  employeeCode: codeSchema.optional(),
  role: jobRoleSchema,
  dailyRate: dailyRateSchema,
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  notes: notesSchema.optional(),
}) satisfies z.ZodType<CreateEmployeeRequest>;

export const updateEmployeeSchema = requireAnyField(
  z.strictObject({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    employeeCode: codeSchema.optional(),
    role: jobRoleSchema.optional(),
    dailyRate: dailyRateSchema.optional(),
    status: z.enum(EMPLOYEE_STATUSES).optional(),
    notes: notesSchema.optional(),
  }),
) satisfies z.ZodType<UpdateEmployeeRequest>;

export const listEmployeesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  search: searchQuerySchema.optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesInput = z.infer<typeof listEmployeesQuerySchema>;
