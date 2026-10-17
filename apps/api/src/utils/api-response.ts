import type { Response } from 'express';
import type { ApiErrorBody, ApiFailure, ApiSuccess, ResponseMeta } from '@umc/shared';

function buildMeta(res: Response): ResponseMeta {
  const id: unknown = res.req.id;
  return {
    timestamp: new Date().toISOString(),
    ...(typeof id === 'string' || typeof id === 'number' ? { requestId: String(id) } : {}),
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const payload: ApiSuccess<T> = { success: true, data, meta: buildMeta(res) };
  res.status(statusCode).json(payload);
}

/** Reserved for the centralized error handler; everything else should throw an `ApiError`. */
export function sendFailure(res: Response, statusCode: number, error: ApiErrorBody): void {
  const payload: ApiFailure = { success: false, error, meta: buildMeta(res) };
  res.status(statusCode).json(payload);
}
