import type { ValidationIssue } from '@umc/shared';
import { ZodError } from 'zod';
import { ApiError } from './api-error.js';

export function toValidationIssues(error: ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

export function fromZodError(err: unknown): ApiError | undefined {
  if (err instanceof ZodError) return ApiError.validation(toValidationIssues(err));
  return undefined;
}
