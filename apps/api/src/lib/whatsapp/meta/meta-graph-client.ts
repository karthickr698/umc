import { z } from 'zod';
import { WHATSAPP_ERROR_CODES, WhatsAppError } from '../whatsapp-error.js';

export interface MetaGraphClientOptions {
  accessToken: string;
  /** e.g. `v23.0`. */
  apiVersion: string;
  /** e.g. `https://graph.facebook.com`. */
  baseUrl: string;
  timeoutMs: number;
}

const graphErrorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    type: z.string().optional(),
    code: z.number().optional(),
    error_subcode: z.number().optional(),
    fbtrace_id: z.string().optional(),
  }),
});

// Meta error codes for throttling and transient failures that are worth retrying.
const RETRYABLE_PROVIDER_CODES = new Set([1, 2, 4, 80007, 130429, 131000, 131048, 131056]);

/** Minimal Graph API transport. Keeps the access token out of every error and log line. */
export class MetaGraphClient {
  private readonly baseUrl: string;

  constructor(private readonly options: MetaGraphClientOptions) {
    this.baseUrl = `${options.baseUrl.replace(/\/+$/, '')}/${options.apiVersion}`;
  }

  postJson<T>(path: string, body: unknown, responseSchema: z.ZodType<T>): Promise<T> {
    return this.request(
      path,
      { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
      responseSchema,
    );
  }

  postForm<T>(path: string, body: FormData, responseSchema: z.ZodType<T>): Promise<T> {
    return this.request(path, { body }, responseSchema);
  }

  private async request<T>(
    path: string,
    init: { headers?: Record<string, string>; body: string | FormData },
    responseSchema: z.ZodType<T>,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${path.replace(/^\/+/, '')}`, {
        method: 'POST',
        headers: { ...init.headers, Authorization: `Bearer ${this.options.accessToken}` },
        body: init.body,
        signal: AbortSignal.timeout(this.options.timeoutMs),
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'TimeoutError') {
        throw new WhatsAppError(
          WHATSAPP_ERROR_CODES.TIMEOUT,
          `WhatsApp request timed out after ${this.options.timeoutMs}ms`,
          { retryable: true, cause: err },
        );
      }
      throw new WhatsAppError(WHATSAPP_ERROR_CODES.NETWORK_ERROR, 'Could not reach WhatsApp API', {
        retryable: true,
        cause: err,
      });
    }

    const payload: unknown = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw toProviderError(response.status, payload);
    }

    const parsed = responseSchema.safeParse(payload);
    if (!parsed.success) {
      throw new WhatsAppError(
        WHATSAPP_ERROR_CODES.PROVIDER_ERROR,
        'Unexpected response from WhatsApp API',
        { httpStatus: response.status, cause: parsed.error },
      );
    }
    return parsed.data;
  }
}

function toProviderError(httpStatus: number, payload: unknown): WhatsAppError {
  const parsed = graphErrorSchema.safeParse(payload);
  const providerError = parsed.success ? parsed.data.error : undefined;
  const providerCode = providerError?.code;
  const retryable =
    httpStatus === 429 ||
    httpStatus >= 500 ||
    (providerCode !== undefined && RETRYABLE_PROVIDER_CODES.has(providerCode));

  const detail = providerError?.message ?? `HTTP ${httpStatus}`;
  const trace = providerError?.fbtrace_id ? ` (fbtrace_id ${providerError.fbtrace_id})` : '';
  return new WhatsAppError(
    WHATSAPP_ERROR_CODES.PROVIDER_ERROR,
    `WhatsApp API error: ${detail}${trace}`,
    { httpStatus, providerCode, retryable },
  );
}
