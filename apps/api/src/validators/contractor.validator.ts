import { z } from 'zod';
import {
  CONTRACTOR_CATEGORIES,
  CONTRACTOR_STATUSES,
  type CreateContractorRequest,
  type UpdateContractorRequest,
} from '@umc/shared';
import {
  addressSchema,
  emailSchema,
  nameSchema,
  notesSchema,
  paginationQuerySchema,
  phoneSchema,
  requireAnyField,
  searchQuerySchema,
} from './common.validator.js';

const categorySchema = z.enum(CONTRACTOR_CATEGORIES);
const statusSchema = z.enum(CONTRACTOR_STATUSES);

export const createContractorSchema = z.strictObject({
  name: nameSchema,
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  category: categorySchema,
  address: addressSchema.optional(),
  status: statusSchema.optional(),
  notes: notesSchema.optional(),
}) satisfies z.ZodType<CreateContractorRequest>;

export const updateContractorSchema = requireAnyField(
  z.strictObject({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    category: categorySchema.optional(),
    address: addressSchema.optional(),
    status: statusSchema.optional(),
    notes: notesSchema.optional(),
  }),
) satisfies z.ZodType<UpdateContractorRequest>;

export const listContractorsQuerySchema = paginationQuerySchema.extend({
  status: statusSchema.optional(),
  category: categorySchema.optional(),
  search: searchQuerySchema.optional(),
});

export type CreateContractorInput = z.infer<typeof createContractorSchema>;
export type UpdateContractorInput = z.infer<typeof updateContractorSchema>;
export type ListContractorsInput = z.infer<typeof listContractorsQuerySchema>;
