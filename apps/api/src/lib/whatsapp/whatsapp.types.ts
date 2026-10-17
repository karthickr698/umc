export const WHATSAPP_PROVIDERS = ['disabled', 'meta'] as const;

export type WhatsAppProvider = (typeof WHATSAPP_PROVIDERS)[number];

/** Ordered by progression; `failed` is terminal and can follow any other status. */
export const WHATSAPP_DELIVERY_STATUSES = [
  'accepted',
  'sent',
  'delivered',
  'read',
  'failed',
] as const;

export type WhatsAppDeliveryStatus = (typeof WHATSAPP_DELIVERY_STATUSES)[number];

export interface WhatsAppTextMessage {
  type: 'text';
  body: string;
  previewUrl?: boolean;
}

/**
 * Business-initiated messages outside the 24-hour customer service window must use a
 * template pre-approved in WhatsApp Manager.
 */
export interface WhatsAppTemplateMessage {
  type: 'template';
  name: string;
  /** e.g. `en` or `en_US`; must match a language the template was approved in. */
  languageCode: string;
  /** Values for the template body's `{{1}}`, `{{2}}`, ... placeholders, in order. */
  bodyParameters?: string[];
  /** For templates approved with a DOCUMENT header, e.g. to send an invoice PDF. */
  headerDocument?: WhatsAppTemplateDocumentHeader;
}

export interface WhatsAppTemplateDocumentHeader {
  document: WhatsAppDocumentSource;
  /** File name shown to the recipient, e.g. `INV-0001.pdf`. */
  fileName: string;
}

export type WhatsAppMessageContent = WhatsAppTextMessage | WhatsAppTemplateMessage;

export interface SendWhatsAppMessageInput {
  /** Recipient phone number with country code; formatting characters are ignored. */
  to: string;
  message: WhatsAppMessageContent;
}

export type WhatsAppDocumentSource =
  /** Publicly reachable HTTPS URL the provider downloads the file from. */
  | { kind: 'url'; url: string }
  /** Media already uploaded to the provider. */
  | { kind: 'media'; mediaId: string }
  /** Raw bytes; uploaded to the provider before sending. */
  | { kind: 'buffer'; content: Buffer | Uint8Array; mimeType: string };

export interface SendWhatsAppDocumentInput {
  to: string;
  document: WhatsAppDocumentSource;
  /** File name shown to the recipient, e.g. `INV-0001.pdf`. */
  fileName: string;
  caption?: string;
}

export interface WhatsAppSendResult {
  /** Provider message id; use it to look up the delivery status later. */
  messageId: string;
  /** Recipient as normalised by the provider. */
  recipient: string;
  status: WhatsAppDeliveryStatus;
}

export interface WhatsAppDeliveryError {
  code?: number;
  title?: string;
  message?: string;
}

export interface WhatsAppDeliveryStatusResult {
  messageId: string;
  status: WhatsAppDeliveryStatus;
  updatedAt: Date;
  recipient?: string;
  errors?: WhatsAppDeliveryError[];
}

/**
 * Provider-agnostic WhatsApp messaging. Business modules (invoices, payments, ...) depend only
 * on this contract and decide *what* to send; providers only know *how* to send it.
 */
export interface WhatsAppService {
  readonly provider: WhatsAppProvider;
  sendMessage(input: SendWhatsAppMessageInput): Promise<WhatsAppSendResult>;
  sendDocument(input: SendWhatsAppDocumentInput): Promise<WhatsAppSendResult>;
  /** `null` when no status is known for `messageId`. */
  getDeliveryStatus(messageId: string): Promise<WhatsAppDeliveryStatusResult | null>;
}
