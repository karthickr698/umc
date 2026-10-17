import { z } from 'zod';
import {
  TENANT_USER_ROLES,
  USER_STATUSES,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@umc/shared';
import {
  emailSchema,
  nameSchema,
  newPasswordSchema,
  paginationQuerySchema,
  phoneSchema,
  requireAnyField,
} from './common.validator.js';

// SUPER_ADMIN is never assignable through user management.
const tenantRoleSchema = z.enum(TENANT_USER_ROLES);

export const createUserSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: newPasswordSchema,
  role: tenantRoleSchema,
}) satisfies z.ZodType<CreateUserRequest>;

export const updateUserSchema = requireAnyField(
  z.strictObject({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    role: tenantRoleSchema.optional(),
    status: z.enum(USER_STATUSES).optional(),
  }),
) satisfies z.ZodType<UpdateUserRequest>;

/** Input of the `create-super-admin` CLI; there is no HTTP endpoint for it. */
export const createSuperAdminSchema = createUserSchema.omit({ role: true });

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: tenantRoleSchema.optional(),
  status: z.enum(USER_STATUSES).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersQuerySchema>;
export type CreateSuperAdminInput = z.infer<typeof createSuperAdminSchema>;
