import type { ReactNode } from 'react';
import { ErrorState } from '@/components/feedback/error-state';
import { PageLoader } from '@/components/feedback/page-loader';
import { describeError } from '@/utils/describe-error';
import { useSession } from './session-context';

interface SessionGateProps {
  /** Rendered once we know whether the user is signed in. */
  children: ReactNode;
}

/** Holds the page until the session is restored, and offers a retry if the server is down. */
export function SessionGate({ children }: SessionGateProps) {
  const { state, retryRestore } = useSession();

  if (state.status === 'loading') {
    return <PageLoader fullScreen label="Restoring your session…" />;
  }

  if (state.status === 'unavailable') {
    const { message, requestId } = describeError(state.error);
    return (
      <div className="route-error route-error--full">
        <ErrorState
          title="We couldn't reach the server"
          message={message}
          requestId={requestId}
          onRetry={retryRestore}
        />
      </div>
    );
  }

  return children;
}
