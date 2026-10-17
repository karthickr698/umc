import type { ReactNode } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { PageLoader } from '@/components/feedback/page-loader';
import type { ApiQuery } from '@/hooks/use-api-query';
import { describeError } from '@/utils/describe-error';

export interface QueryResultProps<T> {
  query: ApiQuery<T>;
  children: (data: T) => ReactNode;
  /** Shown on the first load; later loads keep the previous data on screen. */
  loading?: ReactNode;
}

/** Renders the loading, error, or data state of a `useApiQuery` result. */
export function QueryResult<T>({ query, children, loading }: QueryResultProps<T>) {
  if (query.error !== undefined) {
    const { title, message, requestId } = describeError(query.error);
    return (
      <ErrorState title={title} message={message} requestId={requestId} onRetry={query.retry} />
    );
  }
  if (query.data === undefined) return loading ?? <PageLoader />;
  return children(query.data);
}
