export const WHATSAPP_ERROR_CODES = {
  NOT_CONFIGURED: 'WHATSAPP_NOT_CONFIGURED',
  INVALID_RECIPIENT: 'WHATSAPP_INVALID_RECIPIENT',
  INVALID_REQUEST: 'WHATSAPP_INVALID_REQUEST',
  PROVIDER_ERROR: 'WHATSAPP_PROVIDER_ERROR',
  TIMEOUT: 'WHATSAPP_TIMEOUT',
  NETWORK_ERROR: 'WHATSAPP_NETWORK_ERROR',
} as const;

export type WhatsAppErrorCode = (typeof WHATSAPP_ERROR_CODES)[keyof typeof WHATSAPP_ERROR_CODES];

interface WhatsAppErrorOptions extends ErrorOptions {
  /** HTTP status returned by the provider, when there was a response. */
  httpStatus?: number;
  /** Provider-specific error code, e.g. Meta's `error.code`. */
  providerCode?: number;
  /** Whether retrying the same request later may succeed. */
  retryable?: boolean;
}

/**
 * Failure talking to a WhatsApp provider. Messages are safe to log but are not meant for
 * end users; callers map them to their own domain errors.
 */
export class WhatsAppError extends Error {
  readonly httpStatus?: number;
  readonly providerCode?: number;
  readonly retryable: boolean;

  constructor(
    public readonly code: WhatsAppErrorCode,
    message: string,
    { httpStatus, providerCode, retryable = false, ...options }: WhatsAppErrorOptions = {},
  ) {
    super(message, options);
    this.name = 'WhatsAppError';
    this.httpStatus = httpStatus;
    this.providerCode = providerCode;
    this.retryable = retryable;
  }
}
