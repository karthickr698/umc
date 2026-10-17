import { Navigate, Outlet, useLocation } from 'react-router';
import { APP_ROUTES } from '@/config/routes';
import { toReturnState } from './return-path';
import { SessionGate } from './session-gate';
import { useSession } from './session-context';

/** Layout route: renders its children only for a signed-in user. */
export function RequireAuth() {
  const { state } = useSession();
  const location = useLocation();

  return (
    <SessionGate>
      {state.status === 'authenticated' ? (
        <Outlet />
      ) : (
        <Navigate to={APP_ROUTES.login} replace state={toReturnState(location)} />
      )}
    </SessionGate>
  );
}
