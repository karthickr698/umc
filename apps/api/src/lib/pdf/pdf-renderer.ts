import puppeteer, { type Browser, type LaunchOptions } from 'puppeteer';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { createConcurrencyLimiter } from './concurrency-limiter.js';

export const PDF_CONTENT_TYPE = 'application/pdf';

export interface RenderPdfOptions {
  /** Puppeteer footer template; supports the `pageNumber` and `totalPages` classes. */
  footerTemplate?: string;
}

/** Only inline content may load, so a document can never reach the network or local files. */
const ALLOWED_URL_PREFIXES = ['data:', 'about:'];

let browserPromise: Promise<Browser> | undefined;
const limit = createConcurrencyLimiter(env.PDF_MAX_CONCURRENT_RENDERS);

function launchOptions(): LaunchOptions {
  return {
    headless: 'shell',
    ...(env.PDF_BROWSER_EXECUTABLE_PATH && { executablePath: env.PDF_BROWSER_EXECUTABLE_PATH }),
    // Containers running as root cannot use Chrome's sandbox; opt-in only.
    args: env.PDF_BROWSER_NO_SANDBOX ? ['--no-sandbox', '--disable-setuid-sandbox'] : [],
  };
}

/** One browser is shared by every render and relaunched if it crashes. */
function getBrowser(): Promise<Browser> {
  browserPromise ??= puppeteer.launch(launchOptions()).then(
    (browser) => {
      browser.once('disconnected', () => {
        browserPromise = undefined;
      });
      return browser;
    },
    (err: unknown) => {
      browserPromise = undefined;
      throw err;
    },
  );
  return browserPromise;
}

async function render(html: string, options: RenderPdfOptions): Promise<Uint8Array> {
  const browser = await getBrowser();
  // A fresh context per render keeps documents from sharing cookies, storage or cache.
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(env.PDF_RENDER_TIMEOUT_MS);
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const allowed = ALLOWED_URL_PREFIXES.some((prefix) => request.url().startsWith(prefix));
      void (allowed ? request.continue() : request.abort());
    });
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      timeout: env.PDF_RENDER_TIMEOUT_MS,
      ...(options.footerTemplate !== undefined && {
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: options.footerTemplate,
      }),
    });
  } finally {
    await context.close().catch((err: unknown) => {
      logger.warn({ err }, 'Failed to close PDF browser context');
    });
  }
}

/** Renders a self-contained HTML document (inline CSS and `data:` images only) to an A4 PDF. */
export function renderPdf(html: string, options: RenderPdfOptions = {}): Promise<Uint8Array> {
  return limit(() => render(html, options));
}

/** Closes the shared browser, if one was launched. Call on shutdown. */
export async function closePdfRenderer(): Promise<void> {
  const pending = browserPromise;
  browserPromise = undefined;
  if (!pending) return;
  try {
    await (await pending).close();
  } catch (err) {
    logger.warn({ err }, 'Failed to close PDF browser');
  }
}
