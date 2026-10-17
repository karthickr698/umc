/** Keeps every open tab in step when the user signs in or out in one of them. */
export type SessionEvent = 'signed-in' | 'signed-out';

const CHANNEL_NAME = 'umc:session';

// One shared instance: a BroadcastChannel never receives its own messages, so this tab ignores
// what it announces itself.
const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME);

function isSessionEvent(value: unknown): value is SessionEvent {
  return value === 'signed-in' || value === 'signed-out';
}

export function announceSessionEvent(event: SessionEvent): void {
  channel?.postMessage(event);
}

/** Returns a function that stops listening. */
export function subscribeToSessionEvents(listener: (event: SessionEvent) => void): () => void {
  if (!channel) return () => undefined;
  const handleMessage = ({ data }: MessageEvent<unknown>) => {
    if (isSessionEvent(data)) listener(data);
  };
  channel.addEventListener('message', handleMessage);
  return () => channel.removeEventListener('message', handleMessage);
}
