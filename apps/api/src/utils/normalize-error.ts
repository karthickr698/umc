import { ERROR_CODES, type ErrorCode } from '@umc/shared';
import { ApiError } from './api-error.js';
import { fromMongooseError } from './mongoose-error.js';
import { fromMulterError } from './multer-error.js';
import { fromZodError } from './zod-error.js';

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  400: ERROR_CODES.BAD_REQUEST,
  401: ERROR_CODES.UNAUTHORIZED,
  403: ERROR_CODES.FORBIDDEN,
  404: ERROR_CODES.NOT_FOUND,
  409: ERROR_CODES.CONFLICT,
  413: ERROR_CODES.PAYLOAD_TOO_LARGE,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Errors from body-parser (express.json / express.raw) and other `http-errors`
 * producers carry a `status`; only those flagged `expose` have a client-safe message.
 */
function fromHttpError(err: unknown): ApiError | undefined {
  if (!isRecord(err)) return undefined;

  if (err.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body');
  if (err.type === 'entity.too.large') return ApiError.payloadTooLarge();

  const { status, expose, message } = err;
  if (
    typeof status === 'number' &&
    status >= 400 &&
    status < 500 &&
    expose === true &&
    typeof message === 'string'
  ) {
    return new ApiError(status, CODE_BY_STATUS[status] ?? ERROR_CODES.BAD_REQUEST, message);
  }
  return undefined;
}

/** Converts anything thrown into an `ApiError`; unrecognised errors become a generic 500. */
export function normalizeError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  return (
    fromZodError(err) ??
    fromMongooseError(err) ??
    fromMulterError(err) ??
    fromHttpError(err) ??
    ApiError.internal(err)
  );
}
