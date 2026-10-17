import { FIELD_LIMITS } from '@umc/shared';

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

// Deliberately loose; the server performs the authoritative check.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (trimmed.length > FIELD_LIMITS.email || !EMAIL_PATTERN.test(trimmed)) {
    return 'Enter a valid email address';
  }
  return undefined;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hasErrors(errors: Partial<Record<string, string>>): boolean {
  return Object.values(errors).some(Boolean);
}
