import mongoose, { type ClientSession } from 'mongoose';

export type DbSession = ClientSession;

/**
 * Runs `work` in a MongoDB transaction and commits it, or aborts on error. Transient errors (e.g.
 * write conflicts with a concurrent transaction) re-run `work`, so it must be safe to repeat.
 * Requires a replica set or sharded cluster; a standalone server rejects transactions.
 */
export function withTransaction<T>(work: (session: DbSession) => Promise<T>): Promise<T> {
  return mongoose.connection.transaction(work);
}
