import type { ReactNode } from 'react';
import { useDocumentTitle } from '@/hooks/use-document-title';

interface PageContainerProps {
  title: string;
  description?: string;
  /** Primary page actions, e.g. an "Add site" button. */
  actions?: ReactNode;
  children: ReactNode;
}

/** Standard page frame: heading, optional actions, and a width-constrained body. */
export function PageContainer({ title, description, actions, children }: PageContainerProps) {
  useDocumentTitle(title);

  return (
    <div className="page">
      <header className="page__header">
        <div className="page__heading">
          <h1 className="page__title">{title}</h1>
          {description && <p className="page__description">{description}</p>}
        </div>
        {actions && <div className="page__actions">{actions}</div>}
      </header>
      <div className="page__body">{children}</div>
    </div>
  );
}
