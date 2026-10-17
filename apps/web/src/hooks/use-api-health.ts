import { useCallback, useEffect, useState } from 'react';
import { API_ROUTES, type HealthStatus } from '@umc/shared';
import { apiRequest } from '@/lib/api-client';

type HealthState =
  | { state: 'loading' }
  | { state: 'ready'; health: HealthStatus }
  | { state: 'error'; message: string };

export type ApiHealth = HealthState & { retry: () => void };

export function useApiHealth(): ApiHealth {
  const [result, setResult] = useState<HealthState>({ state: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<HealthStatus>(API_ROUTES.health, { signal: controller.signal })
      .then((health) => setResult({ state: 'ready', health }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult({
          state: 'error',
          message: err instanceof Error ? err.message : 'Unable to reach API',
        });
      });

    return () => controller.abort();
  }, [attempt]);

  const retry = useCallback(() => {
    setResult({ state: 'loading' });
    setAttempt((value) => value + 1);
  }, []);

  return { ...result, retry };
}
