import { useMemo } from 'react';
import { getVisibleNavSections, type NavSection } from '@/config/navigation';
import { useSession } from '@/features/auth';

/** Navigation sections the signed-in user is allowed to see. */
export function useNavSections(): NavSection[] {
  const role = useSession().user?.role;
  return useMemo(() => getVisibleNavSections(role), [role]);
}
