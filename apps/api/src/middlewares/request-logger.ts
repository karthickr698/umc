import { randomUUID } from 'node:crypto';
import { pinoHttp } from 'pino-http';
import { REQUEST_ID_HEADER } from '@umc/shared';
import { logger } from '../config/logger.js';

// Accept an upstream id (e.g. from a proxy) only if it is short and log-safe.
const VALID_REQUEST_ID = /^[\w.-]{1,128}$/;

export const requestLogger = pinoHttp({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers[REQUEST_ID_HEADER.toLowerCase()];
    const id =
      typeof incoming === 'string' && VALID_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader(REQUEST_ID_HEADER, id);
    return id;
  },
  serializers: {
    req: (req: { id: unknown; method: string; url: string }) => ({
      id: req.id,
      method: req.method,
      url: req.url,
    }),
    res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
