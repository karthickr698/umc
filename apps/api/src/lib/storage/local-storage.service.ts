import { createWriteStream } from 'node:fs';
import { mkdir, open, rm, stat, writeFile, type FileHandle } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type {
  ReadFileResult,
  StorageService,
  StoredFile,
  UploadFileInput,
} from './storage.types.js';
import { assertValidStorageKey } from './storage-key.js';

export interface LocalStorageOptions {
  /** Directory files are written to; resolved against the process cwd. */
  rootDir: string;
  /** Absolute URL the root directory is served from, without a trailing slash. */
  publicBaseUrl: string;
}

/** Development driver: stores files on disk and serves them through `express.static`. */
export class LocalStorageService implements StorageService {
  readonly driver = 'local' as const;
  readonly rootDir: string;
  private readonly publicBaseUrl: string;

  constructor(options: LocalStorageOptions) {
    this.rootDir = path.resolve(options.rootDir);
    this.publicBaseUrl = options.publicBaseUrl.replace(/\/+$/, '');
  }

  async upload({ key, body, contentType }: UploadFileInput): Promise<StoredFile> {
    const filePath = this.resolvePath(key);
    await mkdir(path.dirname(filePath), { recursive: true });

    try {
      if (body instanceof Readable) {
        await pipeline(body, createWriteStream(filePath, { flags: 'wx' }));
      } else {
        await writeFile(filePath, body, { flag: 'wx' });
      }
    } catch (err) {
      // Don't leave a partial file behind, but never remove one we didn't create.
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        await rm(filePath, { force: true });
      }
      throw err;
    }

    const { size } = await stat(filePath);
    return { key, size, contentType };
  }

  async read(key: string): Promise<ReadFileResult | null> {
    const filePath = this.resolvePath(key);
    let handle: FileHandle;
    try {
      handle = await open(filePath, 'r');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
    // Stat and stream the same open file so a concurrent delete cannot split the two.
    try {
      const { size } = await handle.stat();
      return { body: handle.createReadStream(), size };
    } catch (err) {
      await handle.close();
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolvePath(key), { force: true });
  }

  getUrl(key: string): Promise<string> {
    assertValidStorageKey(key);
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return Promise.resolve(`${this.publicBaseUrl}/${encodedKey}`);
  }

  private resolvePath(key: string): string {
    assertValidStorageKey(key);
    const filePath = path.resolve(this.rootDir, key);
    if (!filePath.startsWith(this.rootDir + path.sep)) {
      throw new Error(`Storage key resolves outside the storage root: ${JSON.stringify(key)}`);
    }
    return filePath;
  }
}
