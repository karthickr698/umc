import {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  AUTH_HEADER_SCHEME,
  USER_ROLES,
  type AuthSession,
  type UserDto,
} from '@umc/shared';
import { env } from '../config/env.js';
import * as companyRepository from '../repositories/company.repository.js';
import * as refreshTokenRepository from '../repositories/refresh-token.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';
import { ApiError } from '../utils/api-error.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { withTransaction } from '../utils/transaction.js';
import * as auditLogService from './audit-log.service.js';
import * as userService from './user.service.js';

export interface IssuedSession {
  session: AuthSession;
  /** Delivered to the client only via the httpOnly refresh cookie. */
  refreshToken: string;
  refreshTokenMaxAgeMs: number;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const EMAIL_TAKEN = 'An account with this email already exists';

async function issueSession(user: UserDto): Promise<IssuedSession> {
  const refreshTokenMaxAgeMs = env.JWT_REFRESH_TTL_SECONDS * 1000;
  const jti = await refreshTokenRepository.create(
    user.id,
    new Date(Date.now() + refreshTokenMaxAgeMs),
  );

  return {
    session: {
      user,
      accessToken: signAccessToken({ sub: user.id, companyId: user.companyId, role: user.role }),
      tokenType: AUTH_HEADER_SCHEME,
      expiresIn: env.JWT_ACCESS_TTL_SECONDS,
    },
    refreshToken: signRefreshToken({ sub: user.id, jti }),
    refreshTokenMaxAgeMs,
  };
}

/**
 * Self-service sign-up: creates a company and its first user as OWNER, then signs them in. Both
 * documents share a transaction so a failed user insert never leaves an ownerless company.
 */
export async function register(input: RegisterInput): Promise<IssuedSession> {
  // Fast path for a friendly message; the unique email index still guards concurrent sign-ups.
  if (await userRepository.existsByEmail(input.email)) throw ApiError.conflict(EMAIL_TAKEN);

  const { companyName, password, ...profile } = input;
  const passwordHash = await hashPassword(password);
  const owner = await withTransaction(async (session) => {
    const company = await companyRepository.create({ name: companyName }, session);
    return userRepository.create(
      {
        ...profile,
        companyId: company._id.toString(),
        role: USER_ROLES.OWNER,
        passwordHash,
      },
      session,
    );
  });

  return issueSession(userService.toUserDto(owner));
}

export async function login(input: LoginInput): Promise<IssuedSession> {
  const user = await userRepository.findByEmailWithPassword(input.email);
  const passwordMatches = await verifyPassword(input.password, user?.passwordHash);
  if (!user || !passwordMatches) throw ApiError.unauthorized(INVALID_CREDENTIALS);
  if (!userService.isActive(user)) throw ApiError.forbidden('This account is inactive');

  const dto = userService.toUserDto(user);
  const issued = await issueSession(dto);
  await auditLogService.record(dto, {
    action: AUDIT_ACTIONS.LOGIN,
    entity: AUDIT_ENTITIES.USER,
    entityId: dto.id,
    metadata: { role: dto.role },
  });
  return issued;
}

/**
 * Rotates the refresh token: the presented one is consumed and a new pair is issued. A token
 * that verifies but has no live session was already used or revoked, which suggests it was
 * stolen, so every session of that user is revoked.
 */
export async function refresh(refreshToken: string | undefined): Promise<IssuedSession> {
  if (!refreshToken) throw ApiError.unauthorized('Refresh token is missing');
  const claims = verifyRefreshToken(refreshToken);

  const consumed = await refreshTokenRepository.consume(claims.jti, claims.sub);
  if (!consumed) {
    await refreshTokenRepository.deleteAllForUser(claims.sub);
    throw ApiError.unauthorized('Refresh token has been revoked');
  }

  const user = await userService.findActiveById(claims.sub);
  if (!user) throw ApiError.unauthorized('User is no longer active');
  return issueSession(user);
}

/** Idempotent: an absent, expired, or forged token simply has no session to revoke. */
export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  let jti: string;
  try {
    jti = verifyRefreshToken(refreshToken).jti;
  } catch (err) {
    if (err instanceof ApiError) return;
    throw err;
  }
  await refreshTokenRepository.deleteById(jti);
}

/** Resolves the user behind an access token; throws a 401 if the token or user is not valid. */
export async function authenticate(accessToken: string): Promise<UserDto> {
  const claims = verifyAccessToken(accessToken);
  const user = await userService.findActiveById(claims.sub);
  if (!user) throw ApiError.unauthorized('User is no longer active');
  return user;
}
