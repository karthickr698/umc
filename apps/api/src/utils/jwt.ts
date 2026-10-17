import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { USER_ROLES } from '@umc/shared';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';

const ALGORITHM = 'HS256';
const ISSUER = 'umc-api';
const AUDIENCE = 'umc';

const TOKEN_TYPES = { access: 'access', refresh: 'refresh' } as const;

const accessClaimsSchema = z.object({
  sub: z.string().min(1),
  /** `null` for SUPER_ADMIN, who belongs to no company. */
  companyId: z.string().min(1).nullable(),
  role: z.enum(USER_ROLES),
  type: z.literal(TOKEN_TYPES.access),
});

const refreshClaimsSchema = z.object({
  sub: z.string().min(1),
  jti: z.string().min(1),
  type: z.literal(TOKEN_TYPES.refresh),
});

export type AccessTokenClaims = z.infer<typeof accessClaimsSchema>;
export type RefreshTokenClaims = z.infer<typeof refreshClaimsSchema>;

export function signAccessToken(claims: Omit<AccessTokenClaims, 'type'>): string {
  const { sub, ...rest } = claims;
  return jwt.sign({ ...rest, type: TOKEN_TYPES.access }, env.JWT_ACCESS_SECRET, {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: sub,
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
  });
}

export function signRefreshToken(claims: Omit<RefreshTokenClaims, 'type'>): string {
  return jwt.sign({ type: TOKEN_TYPES.refresh }, env.JWT_REFRESH_SECRET, {
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE,
    subject: claims.sub,
    jwtid: claims.jti,
    expiresIn: env.JWT_REFRESH_TTL_SECONDS,
  });
}

function verify<T>(token: string, secret: string, schema: z.ZodType<T>, label: string): T {
  let payload: unknown;
  try {
    payload = jwt.verify(token, secret, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) throw ApiError.unauthorized(`${label} has expired`);
    if (err instanceof jwt.JsonWebTokenError) throw ApiError.unauthorized(`${label} is invalid`);
    throw err;
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw ApiError.unauthorized(`${label} is invalid`);
  return parsed.data;
}

/** Throws a 401 `ApiError` when the token is missing claims, expired, or not signed by us. */
export function verifyAccessToken(token: string): AccessTokenClaims {
  return verify(token, env.JWT_ACCESS_SECRET, accessClaimsSchema, 'Access token');
}

export function verifyRefreshToken(token: string): RefreshTokenClaims {
  return verify(token, env.JWT_REFRESH_SECRET, refreshClaimsSchema, 'Refresh token');
}
