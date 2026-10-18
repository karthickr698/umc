import { STORAGE_KEYS } from '@/config/layout';
import { isCalendarDate } from '@/utils/calendar-date';

/**
 * Filters that follow the user across pages: a period, client or site picked on the dashboard
 * also applies to payments, expenses, receipts and reports, and the other way round.
 */
export const SHARED_FILTER_KEYS = [
  'from',
  'to',
  'clientId',
  'siteId',
  'employeeId',
  'contractorId',
] as const;

export type SharedFilterKey = (typeof SHARED_FILTER_KEYS)[number];

/** Only the filters that are set. */
export type SharedFilters = Readonly<Partial<Record<SharedFilterKey, string>>>;

const DATE_KEYS: readonly SharedFilterKey[] = ['from', 'to'];
const EMPTY: SharedFilters = {};

export function isSharedFilterKey(key: string): key is SharedFilterKey {
  return (SHARED_FILTER_KEYS as readonly string[]).includes(key);
}

function isValid(key: SharedFilterKey, value: string): boolean {
  return value !== '' && (!DATE_KEYS.includes(key) || isCalendarDate(value));
}

function read(): SharedFilters {
  try {
    const parsed: unknown = JSON.parse(
      window.sessionStorage.getItem(STORAGE_KEYS.sharedFilters) ?? '{}',
    );
    if (typeof parsed !== 'object' || parsed === null) return EMPTY;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([key, value]) =>
          isSharedFilterKey(key) && typeof value === 'string' && isValid(key, value),
      ),
    );
  } catch {
    return EMPTY;
  }
}

// Kept per tab, so a stale "this month" range doesn't come back days later.
let snapshot: SharedFilters = read();
const listeners = new Set<() => void>();

function commit(next: SharedFilters): void {
  snapshot = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEYS.sharedFilters, JSON.stringify(next));
  } catch {
    // Filters just won't survive a reload.
  }
  for (const listener of listeners) listener();
}

export function getSharedFilters(): SharedFilters {
  return snapshot;
}

export function subscribeSharedFilters(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Applies `changes` for the shared keys among them; an empty value clears that filter. */
export function setSharedFilters(changes: Readonly<Record<string, string | undefined>>): void {
  const next: Partial<Record<SharedFilterKey, string>> = { ...snapshot };
  let changed = false;
  for (const [key, raw] of Object.entries(changes)) {
    if (!isSharedFilterKey(key) || raw === undefined) continue;
    const value = raw.trim();
    if (isValid(key, value)) {
      if (next[key] !== value) {
        next[key] = value;
        changed = true;
      }
    } else if (key in next) {
      delete next[key];
      changed = true;
    }
  }
  if (changed) commit(next);
}

export function clearSharedFilters(): void {
  if (Object.keys(snapshot).length > 0) commit(EMPTY);
}
