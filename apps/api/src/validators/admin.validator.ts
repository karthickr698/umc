import { z } from 'zod';
import { COMPANY_STATUSES, SITE_STATUSES } from '@umc/shared';
import { objectIdSchema, paginationQuerySchema, searchQuerySchema } from './common.validator.js';

export const adminListCompaniesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(COMPANY_STATUSES).optional(),
  search: searchQuerySchema.optional(),
});

export const adminListSitesQuerySchema = paginationQuerySchema.extend({
  companyId: objectIdSchema.optional(),
  status: z.enum(SITE_STATUSES).optional(),
  search: searchQuerySchema.optional(),
});

export type AdminListCompaniesInput = z.infer<typeof adminListCompaniesQuerySchema>;
export type AdminListSitesInput = z.infer<typeof adminListSitesQuerySchema>;
