import { FIELD_LIMITS, PASSWORD_LIMITS, type RegisterRequest } from '@umc/shared';
import { type FieldErrors, normalizeEmail, validateEmail } from './auth-validation';

/** Every field is a string in the form; an empty phone is omitted from the request. */
export type RegisterFormValues = Required<RegisterRequest> & { confirmPassword: string };
export type RegisterField = keyof RegisterFormValues;
export type RegisterFieldErrors = FieldErrors<RegisterField>;

export const REGISTER_FIELDS: readonly RegisterField[] = [
  'companyName',
  'name',
  'email',
  'phone',
  'password',
  'confirmPassword',
];

export const EMPTY_REGISTER_FORM: RegisterFormValues = {
  companyName: '',
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

function validateName(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length > FIELD_LIMITS.name) {
    return `${label} must be at most ${FIELD_LIMITS.name} characters`;
  }
  return undefined;
}

function validateNewPassword(password: string): string | undefined {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_LIMITS.min) {
    return `Password must be at least ${PASSWORD_LIMITS.min} characters`;
  }
  if (password.length > PASSWORD_LIMITS.max) {
    return `Password must be at most ${PASSWORD_LIMITS.max} characters`;
  }
  return undefined;
}

export function validateRegister(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {
    companyName: validateName(values.companyName, 'Company name'),
    name: validateName(values.name, 'Your name'),
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
  };

  if (values.phone.trim().length > FIELD_LIMITS.phone) {
    errors.phone = `Phone must be at most ${FIELD_LIMITS.phone} characters`;
  }
  if (!values.confirmPassword) errors.confirmPassword = 'Confirm your password';
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

/** Mirrors the server's normalisation; passwords are sent as typed. */
export function normalizeRegister(values: RegisterFormValues): RegisterRequest {
  const phone = values.phone.trim();
  return {
    companyName: values.companyName.trim(),
    name: values.name.trim(),
    email: normalizeEmail(values.email),
    ...(phone && { phone }),
    password: values.password,
  };
}
