import type { RequestHandler } from 'express';
import { z } from 'zod';
import { ApiError } from '../utils/api-error.js';
import { objectIdSchema } from '../validators/common.validator.js';
import { getAuthUser } from './authenticate.js';

export interface CompanyOwnershipOptions {
  /** Route param holding the record id, e.g. `id` for `/users/:id`. */
  param: string;
  /** Human-readable record name used in the 404 message. */
  resource: string;
  /** Resolves the owning company of the record, or `null` when it does not exist. */
  findCompanyId: (id: string) => Promise<string | null>;
}

/**
 * Lets the request through only if the record named by `req.params[param]` belongs to the
 * authenticated user's company. Must run after `authenticate`. Repositories still scope their
 * queries by `companyId`; this guard rejects cross-tenant ids before any handler runs.
 */
export function requireCompanyOwnership({
  param,
  resource,
  findCompanyId,
}: CompanyOwnershipOptions): RequestHandler {
  const paramsSchema = z.object({ [param]: objectIdSchema });

  return async (req, _res, next) => {
    const user = getAuthUser(req);
    const id = paramsSchema.parse(req.params)[param];
    if (id === undefined) throw ApiError.notFound(`${resource} not found`);
    const companyId = await findCompanyId(id);

    // 404 rather than 403 so ids belonging to other companies cannot be probed.
    if (companyId === null || companyId !== user.companyId) {
      throw ApiError.notFound(`${resource} not found`);
    }
    next();
  };
}
