import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { CREATE_RECORD_PARAM } from '@/config/routes';

/**
 * Calls `onRequest` when the URL asks for the "add" form (see `createRecordPath`), then drops
 * the request from the URL so closing the form doesn't reopen it.
 */
export function useCreateRequest(onRequest: () => void, enabled: boolean): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.has(CREATE_RECORD_PARAM);

  useEffect(() => {
    if (!requested) return;
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(CREATE_RECORD_PARAM);
        return next;
      },
      { replace: true },
    );
    if (enabled) onRequest();
  }, [requested, enabled, onRequest, setSearchParams]);
}
