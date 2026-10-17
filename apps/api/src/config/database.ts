import mongoose from 'mongoose';
import type { DatabaseStatus } from '@umc/shared';
import { env } from './env.js';
import { logger } from './logger.js';

const PING_TIMEOUT_MS = 2_000;

const dbLogger = logger.child({ component: 'mongodb' });

let hasConnected = false;
let isClosing = false;

/** Strips credentials and query options (which may carry secrets) so the URL is safe to log. */
export function redactConnectionString(uri: string): string {
  return uri.replace(/\/\/[^@/]*@/, '//***@').replace(/\?.*$/, '');
}

mongoose.set('strictQuery', true);

if (!env.isProduction && dbLogger.isLevelEnabled('debug')) {
  mongoose.set('debug', (collection: string, method: string, ...args: unknown[]) => {
    dbLogger.debug({ collection, method, args }, `${collection}.${method}`);
  });
}

const { connection } = mongoose;

connection.on('connected', () => {
  hasConnected = true;
  dbLogger.info({ host: connection.host, port: connection.port, db: connection.name }, 'Connected');
});
connection.on('reconnected', () => dbLogger.info('Reconnected'));
connection.on('disconnected', () => {
  if (isClosing) dbLogger.info('Connection closed');
  // A failed initial connect also emits this; connectDatabase() reports that case itself.
  else if (hasConnected) dbLogger.warn('Disconnected; the driver will keep trying to reconnect');
});
connection.on('error', (err: unknown) => dbLogger.error({ err }, 'Connection error'));

export async function connectDatabase(uri: string = env.DATABASE_URL): Promise<void> {
  const target = redactConnectionString(uri);
  const startedAt = performance.now();
  dbLogger.info({ target }, 'Connecting');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: env.DATABASE_SERVER_SELECTION_TIMEOUT_MS,
      autoIndex: !env.isProduction,
    });
  } catch (err) {
    throw new Error(
      `Could not connect to MongoDB at ${target}. Check DATABASE_URL and that MongoDB is running ` +
        `(\`npm run db:up\` starts a local instance).`,
      { cause: err },
    );
  }

  dbLogger.debug({ durationMs: Math.round(performance.now() - startedAt) }, 'Connection ready');
}

export async function disconnectDatabase(): Promise<void> {
  if (connection.readyState === mongoose.ConnectionStates.disconnected) return;
  isClosing = true;
  await mongoose.disconnect();
}

/**
 * Builds every index declared on the registered models and drops indexes no schema declares.
 * Resolves to the dropped index names per model. Production connects with `autoIndex` off, so
 * run this (via `npm run db:sync-indexes`) after deploying schema index changes.
 */
export async function syncDatabaseIndexes(): Promise<Record<string, string[]>> {
  const results = await mongoose.syncIndexes();
  return Object.fromEntries(Object.entries(results).map(([name, dropped]) => [name, [...dropped]]));
}

const READY_STATES: Record<number, DatabaseStatus> = {
  [mongoose.ConnectionStates.disconnected]: 'disconnected',
  [mongoose.ConnectionStates.connected]: 'connected',
  [mongoose.ConnectionStates.connecting]: 'connecting',
  [mongoose.ConnectionStates.disconnecting]: 'disconnecting',
};

export function getDatabaseStatus(): DatabaseStatus {
  return READY_STATES[connection.readyState] ?? 'disconnected';
}

export interface DatabaseHealth {
  status: DatabaseStatus;
  latencyMs?: number;
}

/** Reports the connection state and, when connected, verifies MongoDB answers a ping. */
export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const status = getDatabaseStatus();
  const db = connection.db;
  if (status !== 'connected' || !db) return { status };

  const startedAt = performance.now();
  try {
    await db.command({ ping: 1 }, { timeoutMS: PING_TIMEOUT_MS });
    return { status, latencyMs: Math.round(performance.now() - startedAt) };
  } catch (err) {
    dbLogger.warn({ err }, 'Health check ping failed');
    return { status: 'unreachable' };
  }
}
