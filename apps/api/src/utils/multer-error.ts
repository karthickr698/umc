import multer from 'multer';
import { ATTACHMENT_LIMITS, ATTACHMENT_UPLOAD_FIELD } from '@umc/shared';
import { ApiError } from './api-error.js';

const BYTES_PER_MB = 1024 * 1024;

export const MAX_FILE_SIZE_MESSAGE = `Each file must be at most ${
  ATTACHMENT_LIMITS.maxFileSizeBytes / BYTES_PER_MB
} MB`;

/** Multer only parses attachment uploads, so its limit errors are reported in those terms. */
export function fromMulterError(err: unknown): ApiError | undefined {
  if (!(err instanceof multer.MulterError)) return undefined;
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return ApiError.payloadTooLarge(MAX_FILE_SIZE_MESSAGE);
    case 'LIMIT_FILE_COUNT':
      return ApiError.validation([
        {
          path: ATTACHMENT_UPLOAD_FIELD,
          message: `Upload at most ${ATTACHMENT_LIMITS.maxFilesPerRecord} files at a time`,
        },
      ]);
    case 'LIMIT_UNEXPECTED_FILE':
    case 'LIMIT_FIELD_COUNT':
      return ApiError.validation([
        {
          path: err.field ?? ATTACHMENT_UPLOAD_FIELD,
          message: `Send only image files, in the "${ATTACHMENT_UPLOAD_FIELD}" field`,
        },
      ]);
    default:
      return ApiError.badRequest(err.message);
  }
}
