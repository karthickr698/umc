import { type ReactNode, useId } from 'react';
import { APP_NAME } from '@umc/shared';

export interface AuthCardProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Centered card layout shared by the sign-in and sign-up pages. */
export function AuthCard({ title, children, footer }: AuthCardProps) {
  const titleId = useId();

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby={titleId}>
        <header className="auth-card__header">
          <span className="brand__mark" aria-hidden>
            U
          </span>
          <div>
            <h1 id={titleId} className="auth-card__title">
              {title}
            </h1>
            <p className="auth-card__subtitle">{APP_NAME}</p>
          </div>
        </header>
        {children}
        {footer && <p className="auth-card__footer">{footer}</p>}
      </section>
    </main>
  );
}
