import { isRouteErrorResponse } from 'react-router';
import { ApiClientError } from '@/lib/api-client';

export interface ErrorDescription {
  title: string;
  message: string;
  requestId?: string;
  notFound: boolean;
}

const NOT_FOUND_STATUS = 404;

/** Turns anything thrown during rendering, loading, or fetching into user-facing copy. */
export function describeError(error: unknown): ErrorDescription {
  if (isRouteErrorResponse(error)) {
    const notFound = error.status === NOT_FOUND_STATUS;
    return {
      title: notFound ? 'Page not found' : `Error ${error.status}`,
      message: notFound
        ? "The page you're looking for doesn't exist or has moved."
        : error.statusText || 'The request could not be completed.',
      notFound,
    };
  }
  if (error instanceof ApiClientError) {
    return {
      title: 'Request failed',
      message: error.message,
      requestId: error.requestId,
      notFound: error.status === NOT_FOUND_STATUS,
    };
  }
  return {
    title: 'Something went wrong',
    message: error instanceof Error ? error.message : 'An unexpected error occurred.',
    notFound: false,
  };
}
