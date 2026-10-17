import { z } from 'zod';
import { PASSWORD_LIMITS, type LoginRequest, type RegisterRequest } from '@umc/shared';
import { emailSchema, nameSchema, newPasswordSchema, phoneSchema } from './common.validator.js';

export const loginSchema = z.object({
  email: emailSchema,
  // Not trimmed: whitespace can be part of a password.
  password: z.string().min(1, 'Password is required').max(PASSWORD_LIMITS.max),
}) satisfies z.ZodType<LoginRequest>;

export const registerSchema = z.strictObject({
  companyName: nameSchema,
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: newPasswordSchema,
}) satisfies z.ZodType<RegisterRequest>;

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
