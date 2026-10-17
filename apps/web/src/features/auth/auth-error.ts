import { ERROR_CODES } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { issuesByField } from '@/utils/validation-issues';
import type { FieldErrors } from './auth-validation';

export interface AuthFailure<F extends string> {
  message: string;
  fieldErrors: FieldErrors<F>;
  requestId?: string;
  /** Fields to empty so the user retypes them, e.g. the password after wrong credentials. */
  clearFields?: readonly F[];
}

const TOO_MANY_REQUESTS = 429;
const SERVER_ERROR = 500;

/**
 * Turns a failed auth request into copy for the form. Callers handle their endpoint-specific
 * codes (e.g. wrong credentials) first and delegate the rest here.
 */
export function describeAuthError<F extends string>(
  error: unknown,
  fields: readonly F[],
  tooManyRequestsMessage: string,
): AuthFailure<F> {
  const failure: AuthFailure<F> = { message: '', fieldErrors: {} };

  if (!(error instanceof ApiClientError)) {
    // `fetch` rejects with a TypeError when the network or server is unreachable.
    return {
      ...failure,
      message: "We couldn't reach the server. Check your connection and try again.",
    };
  }

  if (error.code === ERROR_CODES.VALIDATION_ERROR) {
    return {
      ...failure,
      message: 'Please correct the highlighted fields.',
      fieldErrors: issuesByField(error.details, fields),
    };
  }
  if (error.status === TOO_MANY_REQUESTS) {
    return { ...failure, message: tooManyRequestsMessage };
  }
  if (error.status >= SERVER_ERROR) {
    return {
      ...failure,
      message: 'Something went wrong on our side. Please try again shortly.',
      requestId: error.requestId,
    };
  }
  return { ...failure, message: error.message, requestId: error.requestId };
}
