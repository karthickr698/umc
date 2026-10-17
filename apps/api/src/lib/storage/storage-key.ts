import { randomUUID } from 'node:crypto';
import path from 'node:path';

const KEY_SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const EXTENSION_PATTERN = /^\.[A-Za-z0-9]{1,10}$/;
const MAX_KEY_LENGTH = 512;

/** Rejects keys that could escape the storage root or be interpreted differently across providers. */
export function assertValidStorageKey(key: string): void {
  const segments = key.split('/');
  const valid =
    key.length > 0 &&
    key.length <= MAX_KEY_LENGTH &&
    segments.every((segment) => KEY_SEGMENT_PATTERN.test(segment) && !segment.includes('..'));
  if (!valid) {
    throw new Error(`Invalid storage key: ${JSON.stringify(key)}`);
  }
}

export interface BuildStorageKeyInput {
  /** Logical folder, e.g. `expenses` or `companies/<id>/receipts`. */
  folder: string;
  /** Used only for its extension; the client-supplied name is never trusted as a path. */
  originalName?: string;
  date?: Date;
}

export function buildStorageKey({
  folder,
  originalName,
  date = new Date(),
}: BuildStorageKeyInput): string {
  const extension = path.extname(originalName ?? '').toLowerCase();
  const safeExtension = EXTENSION_PATTERN.test(extension) ? extension : '';
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const key = `${folder.replace(/^\/+|\/+$/g, '')}/${year}/${month}/${randomUUID()}${safeExtension}`;
  assertValidStorageKey(key);
  return key;
}
