import type { RequestHandler } from 'express';

/** API responses carry tenant and financial data; keep them out of browser and proxy caches. */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
};
