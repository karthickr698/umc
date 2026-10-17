import { hasRole, ROLE_ACCESS, type RoleAccess } from '@umc/shared';
import { useSession } from '@/features/auth';

/** Whether the signed-in user's role has `access`; the API enforces the same rule. */
export function useCan(access: RoleAccess): boolean {
  const { user } = useSession();
  return Boolean(user && hasRole(user.role, ROLE_ACCESS[access]));
}
