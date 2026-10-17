import type { InvoiceDto } from '@umc/shared';
import { formatAmount, formatCalendarDate } from '@/utils/format';

const WHATSAPP_CHAT_URL = 'https://wa.me/';
const MIN_PHONE_DIGITS = 8;

/** Message sent alongside the PDF when it is shared manually. */
export function invoiceShareText(invoice: InvoiceDto): string {
  return [
    `Payment receipt ${invoice.invoiceNumber}`,
    `Paid to: ${invoice.recipientName}`,
    `Amount: ${formatAmount(invoice.amount)}`,
    `Date: ${formatCalendarDate(invoice.invoiceDate)}`,
  ].join('\n');
}

/**
 * Digits for a wa.me link. Only numbers known to include their country code are used, since
 * wa.me would otherwise open a chat with the wrong person; the user then picks the chat.
 */
function chatNumber(invoice: InvoiceDto): string | undefined {
  if (invoice.whatsappRecipient) return invoice.whatsappRecipient;
  const phone = invoice.recipientPhone?.trim();
  if (!phone || !/^(\+|00)/.test(phone)) return undefined;
  const digits = phone.replace(/^00/, '').replace(/\D/g, '');
  return digits.length >= MIN_PHONE_DIGITS ? digits : undefined;
}

/** WhatsApp (app or web) with the message pre-filled, in the recipient's chat when known. */
export function whatsappChatUrl(invoice: InvoiceDto): string {
  const text = encodeURIComponent(invoiceShareText(invoice));
  return `${WHATSAPP_CHAT_URL}${chatNumber(invoice) ?? ''}?text=${text}`;
}
