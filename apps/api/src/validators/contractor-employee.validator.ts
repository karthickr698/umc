import { z } from 'zod';
import {
  CONTRACTOR_EMPLOYEE_STATUSES,
  type CreateContractorEmployeeRequest,
  type UpdateContractorEmployeeRequest,
} from '@umc/shared';
import {
  codeSchema,
  dailyRateSchema,
  nameSchema,
  objectIdSchema,
  paginationQuerySchema,
  phoneSchema,
  requireAnyField,
  searchQuerySchema,
} from './common.validator.js';

export const createContractorEmployeeSchema = z.strictObject({
  contractorId: objectIdSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
  employeeCode: codeSchema.optional(),
  dailyRate: dailyRateSchema.optional(),
  status: z.enum(CONTRACTOR_EMPLOYEE_STATUSES).optional(),
}) satisfies z.ZodType<CreateContractorEmployeeRequest>;

export const updateContractorEmployeeSchema = requireAnyField(
  z.strictObject({
    contractorId: objectIdSchema.optional(),
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    employeeCode: codeSchema.optional(),
    dailyRate: dailyRateSchema.optional(),
    status: z.enum(CONTRACTOR_EMPLOYEE_STATUSES).optional(),
  }),
) satisfies z.ZodType<UpdateContractorEmployeeRequest>;

export const listContractorEmployeesQuerySchema = paginationQuerySchema.extend({
  contractorId: objectIdSchema.optional(),
  status: z.enum(CONTRACTOR_EMPLOYEE_STATUSES).optional(),
  search: searchQuerySchema.optional(),
});

export type CreateContractorEmployeeInput = z.infer<typeof createContractorEmployeeSchema>;
export type UpdateContractorEmployeeInput = z.infer<typeof updateContractorEmployeeSchema>;
export type ListContractorEmployeesInput = z.infer<typeof listContractorEmployeesQuerySchema>;
