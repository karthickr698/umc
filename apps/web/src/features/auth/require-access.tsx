import { Navigate, Outlet } from 'react-router';
import { hasRole, ROLE_ACCESS, type RoleAccess } from '@umc/shared';
import { APP_ROUTES } from '@/config/routes';
import { useSession } from './session-context';

/**
 * Layout route that renders its children only for roles with `access`; others go to the
 * dashboard. The API enforces the same rule, so this only spares users a 403 page.
 */
export function RequireAccess({ access }: { access: RoleAccess }) {
  const { user } = useSession();
  if (!user || !hasRole(user.role, ROLE_ACCESS[access])) {
    return <Navigate to={APP_ROUTES.dashboard} replace />;
  }
  return <Outlet />;
}
