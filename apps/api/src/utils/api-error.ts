import { ERROR_CODES, type ErrorCode, type ValidationIssue } from '@umc/shared';

/**
 * An expected, client-safe failure: `message` and `details` are sent to the client as-is.
 * Anything thrown that is not an `ApiError` (or a known library error) is treated as a bug
 * and answered with a generic 500.
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new ApiError(400, ERROR_CODES.BAD_REQUEST, message, details);
  }

  static validation(issues: ValidationIssue[], message = 'Validation failed') {
    return new ApiError(400, ERROR_CODES.VALIDATION_ERROR, message, issues);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, ERROR_CODES.UNAUTHORIZED, message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, ERROR_CODES.NOT_FOUND, message);
  }

  static conflict(message = 'Conflict', details?: unknown) {
    return new ApiError(409, ERROR_CODES.CONFLICT, message, details);
  }

  static payloadTooLarge(message = 'Payload too large') {
    return new ApiError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, message);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, ERROR_CODES.TOO_MANY_REQUESTS, message);
  }

  static serviceUnavailable(message = 'Service unavailable', details?: unknown, cause?: unknown) {
    return new ApiError(503, ERROR_CODES.SERVICE_UNAVAILABLE, message, details, { cause });
  }

  static internal(cause?: unknown) {
    return new ApiError(500, ERROR_CODES.INTERNAL_ERROR, 'Internal server error', undefined, {
      cause,
    });
  }
}
