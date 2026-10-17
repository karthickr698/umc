import { ChevronRight, House } from 'lucide-react';
import { Link, useMatches } from 'react-router';
import { APP_ROUTES } from '@/config/routes';
import { getBreadcrumb } from '@/lib/route-handle';

export function Breadcrumbs() {
  const crumbs = useMatches().flatMap((match) => {
    const label = getBreadcrumb(match.handle);
    return label ? [{ id: match.id, label, path: match.pathname }] : [];
  });

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        <li className="breadcrumbs__item breadcrumbs__item--home">
          <Link to={APP_ROUTES.dashboard} className="breadcrumbs__link" aria-label="Home">
            <House size={16} aria-hidden />
          </Link>
        </li>
        {crumbs.map((crumb, index) => {
          const isCurrent = index === crumbs.length - 1;
          return (
            <li key={crumb.id} className="breadcrumbs__item">
              <ChevronRight className="breadcrumbs__separator" size={14} aria-hidden />
              {isCurrent ? (
                <span className="breadcrumbs__current" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.path} className="breadcrumbs__link">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
