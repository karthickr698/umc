import { WHATSAPP_ERROR_CODES, WhatsAppError } from './whatsapp-error.js';

// E.164 allows at most 15 digits including the country code.
const E164_DIGITS_PATTERN = /^[1-9]\d{7,14}$/;

/**
 * Converts a stored phone number (e.g. `+91 98765-43210`) to the digits-only international
 * format WhatsApp expects. Numbers must already include their country code.
 */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone
    .trim()
    .replace(/^00/, '')
    .replace(/[\s()+\-.]/g, '');
  if (!E164_DIGITS_PATTERN.test(digits)) {
    throw new WhatsAppError(
      WHATSAPP_ERROR_CODES.INVALID_RECIPIENT,
      'Recipient must be a phone number with country code',
    );
  }
  return digits;
}
