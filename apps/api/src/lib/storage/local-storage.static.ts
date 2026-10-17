import path from 'node:path';
import express, { type Express } from 'express';
import { IMAGE_EXTENSIONS } from '../../utils/image-type.js';
import { LOCAL_STORAGE_ROUTE, storage } from './index.js';
import { LocalStorageService } from './local-storage.service.js';

const IMAGE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Serves local-driver attachment images over HTTP. Anything else in storage (invoice PDFs) is only
 * reachable through authenticated endpoints. No-op for remote drivers, which serve their own URLs.
 */
export function mountLocalStorage(app: Express): void {
  if (!(storage instanceof LocalStorageService)) return;

  const serveFile = express.static(storage.rootDir, {
    dotfiles: 'deny',
    index: false,
    redirect: false,
    cacheControl: false,
    setHeaders: (res) => {
      // Files are tenant data: never stored by shared caches, and never run as active content.
      // Keys are random and never overwritten, so the browser may keep a file without revalidating.
      res.setHeader('Cache-Control', `private, max-age=${IMAGE_MAX_AGE_SECONDS}, immutable`);
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      // helmet defaults to same-origin, which would block the web app from embedding images.
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  app.use(LOCAL_STORAGE_ROUTE, (req, res, next) => {
    if (!IMAGE_EXTENSIONS.includes(path.extname(req.path).toLowerCase())) {
      next();
      return;
    }
    serveFile(req, res, next);
  });
}
