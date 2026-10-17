import { ERROR_CODES } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { type AuthFailure, describeAuthError } from './auth-error';
import { LOGIN_FIELDS, type LoginField } from './login-validation';

/** Turns a failed sign-in into copy for the form. */
export function describeLoginError(error: unknown): AuthFailure<LoginField> {
  if (error instanceof ApiClientError && error.code === ERROR_CODES.UNAUTHORIZED) {
    return { message: error.message, fieldErrors: {}, clearFields: ['password'] };
  }
  return describeAuthError(
    error,
    LOGIN_FIELDS,
    'Too many sign-in attempts. Please wait a moment and try again.',
  );
}
