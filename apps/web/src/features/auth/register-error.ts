import { ERROR_CODES } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { type AuthFailure, describeAuthError } from './auth-error';
import { REGISTER_FIELDS, type RegisterField } from './register-validation';

/** Turns a failed sign-up into copy for the form. */
export function describeRegisterError(error: unknown): AuthFailure<RegisterField> {
  // The only conflict sign-up can hit is an email that already has an account.
  if (error instanceof ApiClientError && error.code === ERROR_CODES.CONFLICT) {
    return { message: error.message, fieldErrors: { email: error.message } };
  }
  return describeAuthError(
    error,
    REGISTER_FIELDS,
    'Too many sign-up attempts. Please wait a moment and try again.',
  );
}
