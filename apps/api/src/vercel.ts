import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app.js';
import { logger } from './config/logger.js';
import { connectDatabase } from './config/database.js';

/**
 * Serverless entry point (Vercel). Replaces `server.ts`: there is no port to listen on or signal
 * to handle, and warm instances reuse the app and its MongoDB connection across requests.
 */
const app = createApp();

let connecting: Promise<void> | undefined;

function ensureDatabase(): Promise<void> {
  connecting ??= connectDatabase().catch((err: unknown) => {
    // Retry on the next request; this one continues and fails with 503 if it needs the database.
    connecting = undefined;
    logger.error({ err }, 'Failed to connect to MongoDB');
  });
  return connecting;
}

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ensureDatabase();
  app(req, res);
}
