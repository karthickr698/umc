import { Navigate, Outlet, useLocation } from 'react-router';
import { readReturnPath } from './return-path';
import { SessionGate } from './session-gate';
import { useSession } from './session-context';

/** Layout route for the login and register pages: a signed-in user is sent on to where they were headed. */
export function GuestOnly() {
  const { state } = useSession();
  const location = useLocation();

  return (
    <SessionGate>
      {state.status === 'authenticated' ? (
        <Navigate to={readReturnPath(location.state)} replace />
      ) : (
        <Outlet />
      )}
    </SessionGate>
  );
}
