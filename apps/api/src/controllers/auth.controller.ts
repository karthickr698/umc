import type { Request, Response } from 'express';
import { getAuthPrincipal } from '../middlewares/authenticate.js';
import * as authService from '../services/auth.service.js';
import { sendSuccess } from '../utils/api-response.js';
import {
  clearRefreshTokenCookie,
  readRefreshTokenCookie,
  setRefreshTokenCookie,
} from '../utils/refresh-token-cookie.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

function sendSession(res: Response, issued: authService.IssuedSession, statusCode = 200): void {
  setRefreshTokenCookie(res, issued.refreshToken, issued.refreshTokenMaxAgeMs);
  res.setHeader('Cache-Control', 'no-store');
  sendSuccess(res, issued.session, statusCode);
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  sendSession(res, await authService.register(input), 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  sendSession(res, await authService.login(input));
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    sendSession(res, await authService.refresh(readRefreshTokenCookie(req)));
  } catch (err) {
    // A rejected refresh token is dead; stop the browser from presenting it again.
    clearRefreshTokenCookie(res);
    throw err;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(readRefreshTokenCookie(req));
  clearRefreshTokenCookie(res);
  res.status(204).end();
}

export function me(req: Request, res: Response): void {
  sendSuccess(res, getAuthPrincipal(req));
}
