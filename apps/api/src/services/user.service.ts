import {
  USER_STATUSES,
  canManageRole,
  type Paginated,
  type TenantUserDto,
  type UserDto,
  type UserRole,
} from '@umc/shared';
import * as refreshTokenRepository from '../repositories/refresh-token.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import type { UserRecord } from '../repositories/user.repository.js';
import { ApiError } from '../utils/api-error.js';
import { toPaginated, toSkipLimit } from '../utils/pagination.js';
import { hashPassword } from '../utils/password.js';
import type {
  CreateSuperAdminInput,
  CreateUserInput,
  ListUsersInput,
  UpdateUserInput,
} from '../validators/user.validator.js';

const USER_NOT_FOUND = 'User not found';

/** Never copies `passwordHash`, even when the record was loaded with it. */
export function toUserDto(user: UserRecord): UserDto {
  return {
    id: user._id.toString(),
    companyId: user.companyId?.toString() ?? null,
    name: user.name,
    email: user.email,
    ...(user.phone !== undefined && { phone: user.phone }),
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function isActive(user: Pick<UserRecord, 'status'>): boolean {
  return user.status === USER_STATUSES.ACTIVE;
}

/** Resolves to `null` when the user no longer exists or has been deactivated. */
export async function findActiveById(id: string): Promise<UserDto | null> {
  const user = await userRepository.findById(id);
  return user && isActive(user) ? toUserDto(user) : null;
}

/** Owning company of a user, for `requireCompanyOwnership`; `null` when the user does not exist. */
export function findCompanyId(id: string): Promise<string | null> {
  return userRepository.findCompanyIdById(id);
}

function assertCanManageRole(actor: TenantUserDto, role: UserRole): void {
  if (!canManageRole(actor.role, role)) {
    throw ApiError.forbidden(`You cannot manage users with the ${role} role`);
  }
}

export async function list(
  actor: TenantUserDto,
  query: ListUsersInput,
): Promise<Paginated<UserDto>> {
  const { page, pageSize, ...filter } = query;
  const { items, total } = await userRepository.listByCompany(
    actor.companyId,
    filter,
    toSkipLimit({ page, pageSize }),
  );
  return toPaginated(items.map(toUserDto), total, { page, pageSize });
}

export async function getById(actor: TenantUserDto, id: string): Promise<UserDto> {
  const user = await userRepository.findByIdInCompany(actor.companyId, id);
  if (!user) throw ApiError.notFound(USER_NOT_FOUND);
  return toUserDto(user);
}

/** The new user always joins the actor's company. */
export async function create(actor: TenantUserDto, input: CreateUserInput): Promise<UserDto> {
  assertCanManageRole(actor, input.role);
  const { password, ...profile } = input;
  const user = await userRepository.create({
    ...profile,
    companyId: actor.companyId,
    passwordHash: await hashPassword(password),
  });
  return toUserDto(user);
}

/** Platform operator with no company; only reachable from the `create-super-admin` CLI. */
export async function createSuperAdmin(input: CreateSuperAdminInput): Promise<UserDto> {
  if (await userRepository.existsByEmail(input.email)) {
    throw ApiError.conflict('An account with this email already exists');
  }
  const { password, ...profile } = input;
  const user = await userRepository.createSuperAdmin({
    ...profile,
    passwordHash: await hashPassword(password),
  });
  return toUserDto(user);
}

export async function update(
  actor: TenantUserDto,
  id: string,
  input: UpdateUserInput,
): Promise<UserDto> {
  const target = await userRepository.findByIdInCompany(actor.companyId, id);
  if (!target) throw ApiError.notFound(USER_NOT_FOUND);

  const isSelf = target._id.toString() === actor.id;
  if (isSelf) {
    // Prevents users locking themselves out or escalating their own privileges.
    if (input.role !== undefined || input.status !== undefined) {
      throw ApiError.forbidden('You cannot change your own role or status');
    }
  } else {
    assertCanManageRole(actor, target.role);
    if (input.role !== undefined) assertCanManageRole(actor, input.role);
  }

  const updated = await userRepository.updateInCompany(actor.companyId, id, input);
  if (!updated) throw ApiError.notFound(USER_NOT_FOUND);

  if (!isActive(updated)) await refreshTokenRepository.deleteAllForUser(id);
  return toUserDto(updated);
}
