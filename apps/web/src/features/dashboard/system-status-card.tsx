import { ErrorState } from '@/components/feedback/error-state';
import { Skeleton } from '@/components/feedback/skeleton';
import { useApiHealth } from '@/hooks/use-api-health';

export function SystemStatusCard() {
  const health = useApiHealth();

  return (
    <section className="card" aria-labelledby="system-status-title" aria-live="polite">
      <h2 id="system-status-title" className="card__title">
        System status
      </h2>

      {health.state === 'loading' && (
        <div className="status-grid" aria-busy="true">
          <Skeleton width="4rem" />
          <Skeleton width="9rem" />
          <Skeleton width="5rem" />
          <Skeleton width="7rem" />
        </div>
      )}

      {health.state === 'error' && (
        <ErrorState
          compact
          title="API unreachable"
          message={health.message}
          onRetry={health.retry}
        />
      )}

      {health.state === 'ready' && (
        <dl className="status-grid">
          <dt>API</dt>
          <dd className="status status--ok">online (v{health.health.version})</dd>
          <dt>Database</dt>
          <dd
            className={`status ${
              health.health.database === 'connected' ? 'status--ok' : 'status--warn'
            }`}
          >
            {health.health.database}
          </dd>
        </dl>
      )}
    </section>
  );
}
