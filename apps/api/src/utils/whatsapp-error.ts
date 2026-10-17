import { ERROR_CODES } from '@umc/shared';
import { WHATSAPP_ERROR_CODES, type WhatsAppError } from '../lib/whatsapp/index.js';
import { ApiError } from './api-error.js';

const BAD_GATEWAY = 502;

/** Meta error codes with a cause the user can act on. */
const PROVIDER_MESSAGES: Readonly<Record<number, string>> = {
  190: 'WhatsApp rejected the server credentials; ask an administrator to check the WhatsApp settings',
  131026: 'This number cannot receive WhatsApp messages; check it is correct and on WhatsApp',
  131030: 'This number is not in the allowed test recipients of the WhatsApp account',
  131047:
    "WhatsApp only allows this message within 24 hours of the recipient's last message; share the PDF manually",
  131051: 'WhatsApp does not support this message type for the recipient',
  132001: 'The WhatsApp invoice template is missing or not approved; ask an administrator',
  133010: 'This number is not registered on WhatsApp',
  130429: 'WhatsApp is limiting how fast messages can be sent; try again in a minute',
  131056: 'Too many messages were sent to this number; try again in a minute',
};

/** Client-safe message for a send failure; the provider's own message is only logged. */
export function whatsappErrorMessage(err: WhatsAppError): string {
  switch (err.code) {
    case WHATSAPP_ERROR_CODES.NOT_CONFIGURED:
      return 'WhatsApp sending is not set up; download the PDF and share it manually';
    case WHATSAPP_ERROR_CODES.INVALID_RECIPIENT:
      return 'Enter a valid phone number with country code, e.g. +91 98765 43210';
    case WHATSAPP_ERROR_CODES.TIMEOUT:
    case WHATSAPP_ERROR_CODES.NETWORK_ERROR:
      return 'WhatsApp did not respond; try again in a moment';
    case WHATSAPP_ERROR_CODES.INVALID_REQUEST:
      return 'The message could not be sent over WhatsApp';
    case WHATSAPP_ERROR_CODES.PROVIDER_ERROR: {
      const known =
        err.providerCode !== undefined ? PROVIDER_MESSAGES[err.providerCode] : undefined;
      if (known) return known;
      if (err.httpStatus === 401 || err.httpStatus === 403) return PROVIDER_MESSAGES[190]!;
      return err.retryable
        ? 'WhatsApp is temporarily unavailable; try again in a moment'
        : 'WhatsApp could not send the message';
    }
  }
}

/** Maps a WhatsApp failure to the API error returned to the client. */
export function fromWhatsAppError(
  err: WhatsAppError,
  details: Record<string, unknown> = {},
): ApiError {
  const message = whatsappErrorMessage(err);
  switch (err.code) {
    case WHATSAPP_ERROR_CODES.NOT_CONFIGURED:
      return new ApiError(503, ERROR_CODES.WHATSAPP_NOT_CONFIGURED, message, details, {
        cause: err,
      });
    case WHATSAPP_ERROR_CODES.INVALID_RECIPIENT:
      return ApiError.validation([{ path: 'phone', message }]);
    default:
      return new ApiError(
        BAD_GATEWAY,
        ERROR_CODES.WHATSAPP_SEND_FAILED,
        message,
        { ...details, retryable: err.retryable },
        { cause: err },
      );
  }
}
