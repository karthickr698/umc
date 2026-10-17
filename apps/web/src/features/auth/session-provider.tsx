import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { AuthSession, LoginRequest, RegisterRequest } from '@umc/shared';
import { setAuthBridge } from '@/lib/api-client';
import { createSession, endSession, registerAccount, restoreSession } from './session-api';
import { announceSessionEvent, subscribeToSessionEvents } from './session-channel';
import { SessionContext, type SessionContextValue, type SessionState } from './session-context';

/** The access token lives only in memory; the refresh token stays in an httpOnly cookie. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [restoreAttempt, setRestoreAttempt] = useState(0);
  const accessTokenRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  const applySession = useCallback(
    (session: AuthSession | null) => {
      accessTokenRef.current = session?.accessToken ?? null;
      const userId = session?.user.id ?? null;
      // Cached responses belong to the previous user's company and role.
      if (userId !== userIdRef.current) {
        userIdRef.current = userId;
        queryClient.clear();
      }
      setState(session ? { status: 'authenticated', session } : { status: 'anonymous' });
    },
    [queryClient],
  );

  useEffect(() => {
    let active = true;
    restoreSession().then(
      (session) => {
        if (active) applySession(session);
      },
      (error: unknown) => {
        if (active) setState({ status: 'unavailable', error });
      },
    );
    return () => {
      active = false;
    };
  }, [applySession, restoreAttempt]);

  useEffect(
    () =>
      setAuthBridge({
        getAccessToken: () => accessTokenRef.current,
        refreshAccessToken: async () => {
          try {
            const session = await restoreSession();
            applySession(session);
            return session?.accessToken ?? null;
          } catch {
            // Offline: keep the current session and let the original request fail.
            return null;
          }
        },
      }),
    [applySession],
  );

  useEffect(
    () =>
      subscribeToSessionEvents((event) => {
        if (event === 'signed-out') {
          applySession(null);
          return;
        }
        restoreSession().then(applySession, () => undefined);
      }),
    [applySession],
  );

  const signIn = useCallback(
    async (credentials: LoginRequest) => {
      applySession(await createSession(credentials));
      announceSessionEvent('signed-in');
    },
    [applySession],
  );

  const signUp = useCallback(
    async (request: RegisterRequest) => {
      applySession(await registerAccount(request));
      announceSessionEvent('signed-in');
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    try {
      await endSession();
    } finally {
      applySession(null);
      announceSessionEvent('signed-out');
    }
  }, [applySession]);

  const retryRestore = useCallback(() => {
    setState({ status: 'loading' });
    setRestoreAttempt((attempt) => attempt + 1);
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      state,
      user: state.status === 'authenticated' ? state.session.user : null,
      signIn,
      signUp,
      signOut,
      retryRestore,
    }),
    [state, signIn, signUp, signOut, retryRestore],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
