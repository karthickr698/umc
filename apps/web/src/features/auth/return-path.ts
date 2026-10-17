import type { Location } from 'react-router';
import { APP_ROUTES } from '@/config/routes';

/** Router state the login page reads to send the user back where they were headed. */
export interface ReturnState {
  from: string;
}

export function toReturnState({ pathname, search, hash }: Location): ReturnState {
  return { from: `${pathname}${search}${hash}` };
}

/** Only same-origin app paths are honoured; anything else falls back to the dashboard. */
export function readReturnPath(state: unknown): string {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return APP_ROUTES.dashboard;
  }
  const { from } = state;
  const isAppPath =
    typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !from.startsWith(APP_ROUTES.login) &&
    !from.startsWith(APP_ROUTES.register);
  return isAppPath ? from : APP_ROUTES.dashboard;
}
