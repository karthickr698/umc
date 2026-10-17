import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const MINUTE_MS = 60_000;

interface LimiterOptions {
  windowMs: number;
  limit: number;
  message: string;
  /** Defaults to the client IP (see `TRUST_PROXY`). */
  keyGenerator?: (req: Request) => string;
  /** Count only failed (status >= 400) responses, e.g. wrong passwords. */
  skipSuccessfulRequests?: boolean;
}

// Counters live in process memory: with several API instances each enforces its own limit, so
// put a shared store (e.g. Redis) behind `store` before scaling out. Disabled in tests, which
// make many requests from one address.
function createLimiter({ message, ...options }: LimiterOptions): RequestHandler {
  return rateLimit({
    ...options,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.isTest,
    handler: (_req, _res, next) => next(ApiError.tooManyRequests(message)),
  });
}

function clientIp(req: Request): string {
  return ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? '');
}

/** Baseline for every API request from one address. */
export const apiRateLimit = createLimiter({
  windowMs: MINUTE_MS,
  limit: env.RATE_LIMIT_API_PER_MINUTE,
  message: 'Too many requests, please slow down and try again shortly',
});

const LOGIN_MESSAGE = 'Too many failed sign-in attempts, please try again later';

/**
 * Failed sign-ins per address, plus per account so a password cannot be guessed from many
 * addresses. The account limit is looser so others cannot easily lock a user out.
 */
export const loginRateLimit: RequestHandler[] = [
  createLimiter({
    windowMs: 15 * MINUTE_MS,
    limit: env.RATE_LIMIT_LOGIN_FAILURES_PER_15_MIN,
    skipSuccessfulRequests: true,
    message: LOGIN_MESSAGE,
  }),
  createLimiter({
    windowMs: 60 * MINUTE_MS,
    limit: env.RATE_LIMIT_LOGIN_FAILURES_PER_15_MIN * 4,
    skipSuccessfulRequests: true,
    message: LOGIN_MESSAGE,
    keyGenerator: (req) => {
      const body: unknown = req.body;
      const email =
        typeof body === 'object' && body !== null && 'email' in body ? body.email : undefined;
      return typeof email === 'string' && email.trim()
        ? `account:${email.trim().toLowerCase()}`
        : `ip:${clientIp(req)}`;
    },
  }),
];

/** Each sign-up creates a company, so it is limited per address. */
export const registerRateLimit = createLimiter({
  windowMs: 60 * MINUTE_MS,
  limit: 10,
  message: 'Too many sign-ups from this address, please try again later',
});

/**
 * PDF rendering, WhatsApp sends and CSV exports are costly; limited per user. Mount after
 * `authenticate`.
 */
export const expensiveOperationRateLimit = createLimiter({
  windowMs: MINUTE_MS,
  limit: 20,
  message: 'Too many document requests, please wait a minute and try again',
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : `ip:${clientIp(req)}`),
});
