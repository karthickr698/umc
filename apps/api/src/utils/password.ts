import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

let dummyHash: Promise<string> | undefined;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

/**
 * Compares against a throwaway hash when there is no stored hash (unknown user), so the
 * response time does not reveal whether an email is registered.
 */
export async function verifyPassword(plain: string, hash: string | undefined): Promise<boolean> {
  if (hash) return bcrypt.compare(plain, hash);
  dummyHash ??= bcrypt.hash('timing-equalisation-placeholder', env.BCRYPT_SALT_ROUNDS);
  await bcrypt.compare(plain, await dummyHash);
  return false;
}
