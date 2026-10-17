import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { APP_ROUTES } from '@/config/routes';
import { useNavSections } from '@/hooks/use-nav-sections';

export function QuickLinks() {
  const items = useNavSections()
    .flatMap((section) => section.items)
    .filter((item) => item.path !== APP_ROUTES.dashboard);

  return (
    <section aria-labelledby="quick-links-title">
      <h2 id="quick-links-title" className="section-title">
        Quick access
      </h2>
      <ul className="quick-links">
        {items.map(({ id, label, description, path, icon: Icon }) => (
          <li key={id}>
            <Link to={path} className="quick-link">
              <span className="quick-link__icon" aria-hidden>
                <Icon size={20} />
              </span>
              <span className="quick-link__text">
                <span className="quick-link__label">{label}</span>
                <span className="quick-link__description">{description}</span>
              </span>
              <ChevronRight className="quick-link__chevron" size={16} aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
