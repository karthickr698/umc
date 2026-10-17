import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router';
import { ErrorState } from '@/components/feedback/error-state';
import { APP_ROUTES } from '@/config/routes';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { describeError } from '@/utils/describe-error';

function RouteError({ fullScreen }: { fullScreen: boolean }) {
  const error = useRouteError();
  const { title, message, requestId, notFound } = describeError(error);
  useDocumentTitle(title);

  useEffect(() => {
    if (import.meta.env.DEV && !notFound) console.error(error);
  }, [error, notFound]);

  return (
    <div className={fullScreen ? 'route-error route-error--full' : 'route-error'}>
      <ErrorState
        title={title}
        message={message}
        requestId={requestId}
        onRetry={notFound ? undefined : () => window.location.reload()}
        actions={
          // A full page load also recovers when the shell itself failed to render.
          fullScreen ? (
            <a className="button" href={APP_ROUTES.dashboard}>
              Go to dashboard
            </a>
          ) : (
            <Link className="button" to={APP_ROUTES.dashboard}>
              Go to dashboard
            </Link>
          )
        }
      />
    </div>
  );
}

/** Errors inside a page: the shell stays usable and only the content area shows the error. */
export function RouteErrorBoundary() {
  return <RouteError fullScreen={false} />;
}

/** Last resort when the shell itself throws. */
export function RootErrorBoundary() {
  return <RouteError fullScreen />;
}
