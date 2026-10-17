import { createContext, useContext } from 'react';
import type { AuthSession, LoginRequest, RegisterRequest, UserDto } from '@umc/shared';

export type SessionState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: AuthSession }
  | { status: 'anonymous' }
  /** The server could not be reached while restoring, so we don't know whether a session exists. */
  | { status: 'unavailable'; error: unknown };

export interface SessionContextValue {
  state: SessionState;
  user: UserDto | null;
  /** Rejects with the API error when the credentials are refused. */
  signIn: (credentials: LoginRequest) => Promise<void>;
  /** Registers a new company with the caller as OWNER and signs them in; rejects with the API error. */
  signUp: (request: RegisterRequest) => Promise<void>;
  signOut: () => Promise<void>;
  retryRestore: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
