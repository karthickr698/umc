import { PASSWORD_LIMITS, type LoginRequest } from '@umc/shared';
import { type FieldErrors, normalizeEmail, validateEmail } from './auth-validation';

export type LoginField = keyof LoginRequest;
export type LoginFieldErrors = FieldErrors<LoginField>;

export const LOGIN_FIELDS: readonly LoginField[] = ['email', 'password'];

export function validateLogin({ email, password }: LoginRequest): LoginFieldErrors {
  const errors: LoginFieldErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!password) errors.password = 'Password is required';
  else if (password.length > PASSWORD_LIMITS.max) {
    errors.password = `Password must be at most ${PASSWORD_LIMITS.max} characters`;
  }

  return errors;
}

/** Mirrors the server's normalisation; passwords are sent as typed. */
export function normalizeLogin({ email, password }: LoginRequest): LoginRequest {
  return { email: normalizeEmail(email), password };
}
