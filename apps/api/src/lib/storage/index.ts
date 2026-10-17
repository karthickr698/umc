import { env } from '../../config/env.js';
import { LocalStorageService } from './local-storage.service.js';
import { S3StorageService } from './s3-storage.service.js';
import type { StorageService } from './storage.types.js';

/** Path the local driver's files are served from (see `mountLocalStorage`). */
export const LOCAL_STORAGE_ROUTE = '/uploads';

function createStorageService(): StorageService {
  switch (env.STORAGE_DRIVER) {
    case 'local':
      return new LocalStorageService({
        rootDir: env.STORAGE_LOCAL_DIR,
        publicBaseUrl:
          env.STORAGE_PUBLIC_BASE_URL ?? `http://localhost:${env.PORT}${LOCAL_STORAGE_ROUTE}`,
      });
    case 's3':
      return new S3StorageService(env.s3Storage);
  }
}

/** The configured storage driver. Business code depends only on the `StorageService` contract. */
export const storage: StorageService = createStorageService();

export { buildStorageKey, type BuildStorageKeyInput } from './storage-key.js';
export type {
  GetFileUrlOptions,
  ReadFileResult,
  StorageDriver,
  StorageService,
  StoredFile,
  UploadFileInput,
} from './storage.types.js';
