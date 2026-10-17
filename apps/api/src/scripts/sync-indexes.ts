/**
 * Creates the indexes declared on every model and drops indexes no schema declares any more.
 * The API connects with `autoIndex` off in production, so run this after each deploy that
 * changes an index:
 *
 *   npm run db:sync-indexes -w @umc/api
 */
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { connectDatabase, disconnectDatabase, syncDatabaseIndexes } from '../config/database.js';
import { logger } from '../config/logger.js';

const MODEL_FILE = /\.model\.(ts|js)$/;

/** Importing each model file registers it with Mongoose; works from `src` (tsx) and `dist`. */
async function registerModels(): Promise<void> {
  const modelsDir = path.resolve(import.meta.dirname, '../models');
  const files = (await readdir(modelsDir)).filter((file) => MODEL_FILE.test(file));
  await Promise.all(files.map((file) => import(pathToFileURL(path.join(modelsDir, file)).href)));
}

async function main(): Promise<void> {
  await registerModels();
  await connectDatabase();
  try {
    const dropped = await syncDatabaseIndexes();
    logger.info({ dropped }, 'Indexes synced');
  } finally {
    await disconnectDatabase();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error({ err }, `Failed to sync indexes: ${message}`);
  process.exitCode = 1;
});
