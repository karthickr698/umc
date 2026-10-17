import {
  authRoute,
  ERROR_CODES,
  type AuthSession,
  type LoginRequest,
  type RegisterRequest,
} from '@umc/shared';
import { ApiClientError, apiRequest } from '@/lib/api-client';

const REFRESH_LOCK = 'umc:session-refresh';

let pendingRestore: Promise<AuthSession | null> | null = null;

/**
 * Refresh tokens rotate on every use, so tabs sharing the cookie must not refresh concurrently:
 * the second request would present an already-spent token and the server would revoke every
 * session of the user.
 */
function withRefreshLock<T>(task: () => Promise<T>): Promise<T> {
  return 'locks' in navigator ? navigator.locks.request(REFRESH_LOCK, task) : task();
}

/**
 * Exchanges the httpOnly refresh cookie for a session, or resolves `null` when there is none.
 * Rejects when the server cannot be reached, so callers can tell "signed out" from "offline".
 * Overlapping callers in this tab (e.g. StrictMode's double effects) share a single request.
 */
export function restoreSession(): Promise<AuthSession | null> {
  pendingRestore ??= withRefreshLock(() =>
    apiRequest<AuthSession>(authRoute('refresh'), { method: 'POST', skipAuth: true }),
  )
    .catch((error: unknown) => {
      if (error instanceof ApiClientError && error.code === ERROR_CODES.UNAUTHORIZED) return null;
      throw error;
    })
    .finally(() => {
      pendingRestore = null;
    });
  return pendingRestore;
}

/** Creates a company with the caller as OWNER and returns their new session. */
export function registerAccount(request: RegisterRequest): Promise<AuthSession> {
  return apiRequest<AuthSession>(authRoute('register'), {
    method: 'POST',
    body: JSON.stringify(request),
    skipAuth: true,
  });
}

export function createSession(credentials: LoginRequest): Promise<AuthSession> {
  return apiRequest<AuthSession>(authRoute('login'), {
    method: 'POST',
    body: JSON.stringify(credentials),
    skipAuth: true,
  });
}

export function endSession(): Promise<void> {
  return apiRequest<void>(authRoute('logout'), { method: 'POST', skipAuth: true });
}
