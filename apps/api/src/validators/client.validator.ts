import { z } from 'zod';
import { CLIENT_STATUSES, type CreateClientRequest, type UpdateClientRequest } from '@umc/shared';
import {
  addressSchema,
  emailSchema,
  nameSchema,
  paginationQuerySchema,
  phoneSchema,
  requireAnyField,
  searchQuerySchema,
} from './common.validator.js';

export const createClientSchema = z.strictObject({
  name: nameSchema,
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
  address: addressSchema.optional(),
  status: z.enum(CLIENT_STATUSES).optional(),
}) satisfies z.ZodType<CreateClientRequest>;

export const updateClientSchema = requireAnyField(
  z.strictObject({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    address: addressSchema.optional(),
    status: z.enum(CLIENT_STATUSES).optional(),
  }),
) satisfies z.ZodType<UpdateClientRequest>;

export const listClientsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CLIENT_STATUSES).optional(),
  search: searchQuerySchema.optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsInput = z.infer<typeof listClientsQuerySchema>;
