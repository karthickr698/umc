import { Link } from 'react-router';
import { APP_NAME } from '@umc/shared';
import { APP_ROUTES } from '@/config/routes';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to={APP_ROUTES.dashboard} className="brand" aria-label={`${APP_NAME} home`}>
      <span className="brand__mark" aria-hidden>
        U
      </span>
      {!compact && (
        <span className="brand__text">
          <span className="brand__name">UMC</span>
          <span className="brand__tagline">Construction</span>
        </span>
      )}
    </Link>
  );
}
