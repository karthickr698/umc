import path from 'node:path';

/**
 * Display name for a client-supplied file name: directories and control characters are dropped
 * and the result is cut to `maxLength`. Never use it to build a storage path.
 */
export function toSafeFileName(name: string, maxLength: number, fallback: string): string {
  const baseName = path.posix.basename(name.replaceAll('\\', '/'));
  const cleaned = baseName.replace(/\p{Cc}/gu, '').trim();
  return cleaned.slice(0, maxLength).trim() || fallback;
}
