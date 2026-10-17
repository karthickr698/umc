import type { CookieOptions, Request, Response } from 'express';
import { API_PREFIX, API_ROUTES, REFRESH_TOKEN_COOKIE } from '@umc/shared';
import { env } from '../config/env.js';

const baseOptions: CookieOptions = {
  httpOnly: true,
  // Browsers reject SameSite=None cookies that are not Secure.
  secure: env.isProduction || env.REFRESH_COOKIE_SAME_SITE === 'none',
  sameSite: env.REFRESH_COOKIE_SAME_SITE,
  path: `${API_PREFIX}${API_ROUTES.auth.base}`,
};

export function setRefreshTokenCookie(res: Response, token: string, maxAgeMs: number): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, { ...baseOptions, maxAge: maxAgeMs });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, baseOptions);
}

export function readRefreshTokenCookie(req: Request): string | undefined {
  const cookies: Record<string, unknown> | undefined = req.cookies;
  const value = cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
