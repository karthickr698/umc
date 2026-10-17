import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

/**
 * CSRF guard for endpoints that act on the refresh cookie or set it. CORS only hides the response
 * from other sites; the request itself would still run. Browsers always send `Origin` on
 * cross-site POSTs, so requests without one (curl, Postman, server-to-server) are let through.
 */
export const requireTrustedOrigin: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin');
  if (origin !== undefined && !env.corsOrigins.includes(origin)) {
    throw ApiError.forbidden('Request origin is not allowed');
  }
  next();
};
