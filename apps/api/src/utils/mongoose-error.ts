import mongoose from 'mongoose';
import type { ValidationIssue } from '@umc/shared';
import { ApiError } from './api-error.js';

const MONGO_DUPLICATE_KEY = 11000;

// Mongoose raises a plain MongooseError when a query waits too long for a connection.
const BUFFERING_TIMEOUT = /buffering timed out/i;

// Cast messages echo the raw value and schema internals, so we replace them with a generic one.
function castIssue(path: string, kind: string): ValidationIssue {
  return { path, message: `Invalid ${kind}`, code: 'invalid_type' };
}

function toValidationIssues(err: mongoose.Error.ValidationError): ValidationIssue[] {
  return Object.entries(err.errors).map(([path, fieldError]) =>
    fieldError instanceof mongoose.Error.CastError
      ? castIssue(path, fieldError.kind)
      : { path, message: fieldError.message, code: fieldError.kind },
  );
}

function duplicateKeyFields(err: mongoose.mongo.MongoServerError): string[] {
  const { keyValue, keyPattern } = err as { keyValue?: object; keyPattern?: object };
  return Object.keys(keyValue ?? keyPattern ?? {});
}

function isConnectionError(err: unknown): boolean {
  return (
    err instanceof mongoose.Error.MongooseServerSelectionError ||
    err instanceof mongoose.mongo.MongoServerSelectionError ||
    err instanceof mongoose.mongo.MongoNetworkError ||
    err instanceof mongoose.mongo.MongoNotConnectedError ||
    err instanceof mongoose.mongo.MongoTopologyClosedError ||
    (err instanceof mongoose.Error && BUFFERING_TIMEOUT.test(err.message))
  );
}

/** Maps Mongoose / MongoDB driver errors that have a meaningful client-facing status. */
export function fromMongooseError(err: unknown): ApiError | undefined {
  if (err instanceof mongoose.Error.ValidationError) {
    return ApiError.validation(toValidationIssues(err));
  }
  if (err instanceof mongoose.Error.CastError) {
    return ApiError.validation([castIssue(err.path, err.kind)]);
  }
  if (err instanceof mongoose.Error.StrictModeError) {
    return ApiError.validation([
      { path: err.path, message: 'Field is not allowed', code: 'unrecognized_keys' },
    ]);
  }
  if (err instanceof mongoose.Error.DocumentNotFoundError) {
    return ApiError.notFound();
  }
  if (err instanceof mongoose.Error.VersionError) {
    return ApiError.conflict('The resource was modified by another request; reload and retry');
  }
  if (err instanceof mongoose.mongo.MongoServerError && err.code === MONGO_DUPLICATE_KEY) {
    const fields = duplicateKeyFields(err);
    const message =
      fields.length > 0 ? `Duplicate value for ${fields.join(', ')}` : 'Duplicate value';
    return ApiError.conflict(message, { fields });
  }
  if (isConnectionError(err)) {
    return ApiError.serviceUnavailable('Database is temporarily unavailable', undefined, err);
  }
  return undefined;
}
