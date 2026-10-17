import type { ErrorRequestHandler } from 'express';
import { ERROR_CODES, type ApiErrorBody } from '@umc/shared';
import { env } from '../config/env.js';
import { sendFailure } from '../utils/api-response.js';
import { normalizeError } from '../utils/normalize-error.js';

function debugDetails(err: unknown): unknown {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { thrown: String(err) };
}

export const errorHandler: ErrorRequestHandler = (err: unknown, req, res, next) => {
  // Once streaming has started we can't send a JSON body; let Express close the connection.
  if (res.headersSent) {
    next(err);
    return;
  }

  const apiError = normalizeError(err);
  const body: ApiErrorBody = {
    code: apiError.code,
    message: apiError.message,
    ...(apiError.details !== undefined && { details: apiError.details }),
  };

  if (apiError.code === ERROR_CODES.INTERNAL_ERROR) {
    const original = apiError.cause ?? err;
    req.log.error({ err: original }, 'Unhandled error');
    // Never in production: the original error may contain queries, paths or secrets.
    if (!env.isProduction) body.details = debugDetails(original);
  } else if (apiError.statusCode >= 500) {
    req.log.warn({ err: apiError.cause ?? apiError }, apiError.message);
  }

  sendFailure(res, apiError.statusCode, body);
};
