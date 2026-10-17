import type { RequestHandler } from 'express';
import { hasRole, type UserRole } from '@umc/shared';
import { ApiError } from '../utils/api-error.js';
import { getAuthPrincipal } from './authenticate.js';

/**
 * Lets the request through only if the authenticated user has one of `allowed` roles. Pass a
 * `ROLE_ACCESS` entry from `@umc/shared` rather than listing roles inline. Must run after
 * `authenticate`; without it the request fails closed with a 401.
 */
export function requireRoles(allowed: readonly UserRole[]): RequestHandler {
  if (allowed.length === 0) throw new Error('requireRoles needs at least one role');

  return (req, _res, next) => {
    if (!hasRole(getAuthPrincipal(req).role, allowed)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
}
