import { z } from 'zod';
import { SITE_STATUSES, type CreateSiteRequest, type UpdateSiteRequest } from '@umc/shared';
import {
  addressSchema,
  isoDateSchema,
  nameSchema,
  objectIdSchema,
  paginationQuerySchema,
  requireAnyField,
  searchQuerySchema,
} from './common.validator.js';

export const createSiteSchema = z.strictObject({
  name: nameSchema,
  clientId: objectIdSchema,
  address: addressSchema.optional(),
  status: z.enum(SITE_STATUSES).optional(),
  startDate: isoDateSchema.optional(),
}) satisfies z.ZodType<CreateSiteRequest>;

export const updateSiteSchema = requireAnyField(
  z.strictObject({
    name: nameSchema.optional(),
    clientId: objectIdSchema.optional(),
    address: addressSchema.optional(),
    status: z.enum(SITE_STATUSES).optional(),
    startDate: isoDateSchema.optional(),
  }),
) satisfies z.ZodType<UpdateSiteRequest>;

export const listSitesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(SITE_STATUSES).optional(),
  clientId: objectIdSchema.optional(),
  search: searchQuerySchema.optional(),
});

export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type ListSitesInput = z.infer<typeof listSitesQuerySchema>;
