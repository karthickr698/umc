import type { Readable } from 'node:stream';

export const STORAGE_DRIVERS = ['local'] as const;

export type StorageDriver = (typeof STORAGE_DRIVERS)[number];

export interface UploadFileInput {
  /** Provider-neutral object key, e.g. `expenses/2026/10/<uuid>.pdf`. Build with `buildStorageKey`. */
  key: string;
  body: Buffer | Uint8Array | Readable;
  contentType: string;
}

export interface StoredFile {
  key: string;
  size: number;
  contentType: string;
}

export interface ReadFileResult {
  body: Readable;
  size: number;
}

export interface GetFileUrlOptions {
  /** Lifetime of a signed URL. Drivers that serve public URLs ignore it. */
  expiresInSeconds?: number;
}

/**
 * Driver-agnostic file storage. Business modules persist only the returned `key` and resolve
 * URLs on demand, so switching drivers (e.g. local -> S3) needs no data migration.
 */
export interface StorageService {
  readonly driver: StorageDriver;
  upload(input: UploadFileInput): Promise<StoredFile>;
  /** Streams a stored file; `null` when nothing is stored under `key`. */
  read(key: string): Promise<ReadFileResult | null>;
  /** Idempotent: deleting a missing key is not an error. */
  delete(key: string): Promise<void>;
  /** Async so signed-URL drivers can fit the same contract. */
  getUrl(key: string, options?: GetFileUrlOptions): Promise<string>;
}
