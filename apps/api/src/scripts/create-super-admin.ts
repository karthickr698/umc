/**
 * Creates a SUPER_ADMIN account. There is deliberately no HTTP endpoint for this.
 *
 *   npm run create-super-admin -w @umc/api -- --email ops@example.com --name "Ops Team" [--phone ...]
 *
 * The password is prompted for (hidden) so it never lands in shell history.
 */
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { parseArgs } from 'node:util';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';
import { createSuperAdmin } from '../services/user.service.js';
import { createSuperAdminSchema } from '../validators/user.validator.js';

async function promptHidden(question: string): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (!muted) process.stdout.write(chunk);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  try {
    process.stdout.write(question);
    muted = true;
    return await rl.question('');
  } finally {
    rl.close();
    process.stdout.write('\n');
  }
}

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) throw new Error('Run this script in an interactive terminal');
  const password = await promptHidden('Password: ');
  const confirmation = await promptHidden('Confirm password: ');
  if (password !== confirmation) throw new Error('Passwords do not match');
  return password;
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      phone: { type: 'string' },
    },
  });

  const input = createSuperAdminSchema.parse({ ...values, password: await readPassword() });
  await connectDatabase();
  try {
    const user = await createSuperAdmin(input);
    logger.info({ userId: user.id, email: user.email }, 'Super admin created');
  } finally {
    await disconnectDatabase();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err }, `Failed to create super admin: ${message}`);
  process.exitCode = 1;
});
