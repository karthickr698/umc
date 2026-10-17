import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { Request, Response } from 'express';

export interface FileDownload {
  body: Readable;
  size: number;
  contentType: string;
  /** Must be a plain ASCII name without quotes (e.g. `INV-2026-00042.pdf`). */
  fileName: string;
  /** `inline` lets the browser display the file; `attachment` saves it. */
  disposition: 'inline' | 'attachment';
}

/** Streams a stored file as the response body; for authenticated, non-cacheable downloads. */
export async function sendFile(req: Request, res: Response, file: FileDownload): Promise<void> {
  res.status(200);
  res.setHeader('Content-Type', file.contentType);
  res.setHeader('Content-Length', String(file.size));
  res.setHeader('Content-Disposition', `${file.disposition}; filename="${file.fileName}"`);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  try {
    await pipeline(file.body, res);
  } catch (err) {
    // Typically the client went away mid-download; the response can no longer carry an error.
    if (res.headersSent) {
      req.log.warn({ err }, 'File download interrupted');
      return;
    }
    throw err;
  }
}
