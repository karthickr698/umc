import type { Request, RequestHandler } from 'express';
import { AUTH_HEADER_SCHEME, type TenantUserDto, type UserDto } from '@umc/shared';
import * as authService from '../services/auth.service.js';
import { ApiError } from '../utils/api-error.js';

function readBearerToken(req: Request): string {
  const header = req.headers.authorization;
  if (!header) throw ApiError.unauthorized('Authentication required');

  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== AUTH_HEADER_SCHEME.toLowerCase() || !token || rest.length > 0) {
    throw ApiError.unauthorized(`Authorization header must be "${AUTH_HEADER_SCHEME} <token>"`);
  }
  return token;
}

/** Verifies the Bearer access token and attaches the active user to `req.user`. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  req.user = await authService.authenticate(readBearerToken(req));
  req.log = req.log.child({ userId: req.user.id });
  next();
};

/**
 * Any authenticated user, including a SUPER_ADMIN without a company. Use only in handlers mounted
 * behind `authenticate` that do not act on a company's data.
 */
export function getAuthPrincipal(req: Request): UserDto {
  if (!req.user) throw ApiError.unauthorized('Authentication required');
  return req.user;
}

/**
 * The authenticated company user; use in every company-scoped handler mounted behind
 * `authenticate`. Fails closed with a 403 for users without a company (SUPER_ADMIN).
 */
export function getAuthUser(req: Request): TenantUserDto {
  const user = getAuthPrincipal(req);
  const { companyId } = user;
  if (companyId === null) {
    throw ApiError.forbidden('This action is only available to company users');
  }
  return { ...user, companyId };
}
