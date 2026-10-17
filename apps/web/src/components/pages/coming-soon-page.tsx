import { Construction } from 'lucide-react';
import { useLocation } from 'react-router';
import { EmptyState } from '@/components/feedback/empty-state';
import { PageContainer } from '@/components/layout/page-container';
import { findNavItemByPath } from '@/config/navigation';

/** Stand-in for modules whose screens haven't been built yet. */
export function ComingSoonPage() {
  const item = findNavItemByPath(useLocation().pathname);

  return (
    <PageContainer title={item?.label ?? 'Coming soon'} description={item?.description}>
      <EmptyState
        className="card"
        icon={item?.icon ?? Construction}
        title="Under construction"
        message="This module is being built. It will appear here once it's ready."
      />
    </PageContainer>
  );
}
