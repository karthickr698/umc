import { Link } from 'react-router';
import { ErrorState } from '@/components/feedback/error-state';
import { PageContainer } from '@/components/layout/page-container';
import { APP_ROUTES } from '@/config/routes';

export function NotFoundPage() {
  return (
    <PageContainer title="Page not found">
      <ErrorState
        title="We couldn't find that page"
        message="The link may be broken, or the page may have been moved."
        actions={
          <Link className="button button--primary" to={APP_ROUTES.dashboard}>
            Go to dashboard
          </Link>
        }
      />
    </PageContainer>
  );
}
