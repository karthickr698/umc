import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ERROR_CODES, type InvoiceDto } from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { issuesByField } from '@/utils/validation-issues';
import { sendInvoiceWhatsapp } from '../invoices-api';
import { invoiceQueryKey } from './use-payment-invoice';

export type WhatsappSendFailure =
  /** The server has no WhatsApp account; only manual sharing works. */
  | { kind: 'not-configured'; message: string }
  | { kind: 'invalid-phone'; message: string }
  | { kind: 'failed'; message: string; retryable: boolean };

function isRetryable(details: unknown): boolean {
  return (
    typeof details === 'object' &&
    details !== null &&
    'retryable' in details &&
    details.retryable === true
  );
}

function toFailure(error: unknown): WhatsappSendFailure {
  if (!(error instanceof ApiClientError)) {
    return { kind: 'failed', message: 'Could not reach the server; try again', retryable: true };
  }
  if (error.code === ERROR_CODES.WHATSAPP_NOT_CONFIGURED) {
    return { kind: 'not-configured', message: error.message };
  }
  if (error.code === ERROR_CODES.VALIDATION_ERROR) {
    const phone = issuesByField(error.details, ['phone'] as const).phone;
    if (phone) return { kind: 'invalid-phone', message: phone };
  }
  return { kind: 'failed', message: error.message, retryable: isRetryable(error.details) };
}

/** Sends the invoice PDF over WhatsApp; the saved status is refreshed whatever the outcome. */
export function useInvoiceWhatsapp(invoice: InvoiceDto) {
  const queryClient = useQueryClient();
  const queryKey = invoiceQueryKey(invoice.id);

  const mutation = useMutation({
    mutationFn: (phone: string) =>
      sendInvoiceWhatsapp(invoice.id, phone.trim() ? { phone: phone.trim() } : {}),
    onSuccess: (updated) => queryClient.setQueryData(queryKey, updated),
    // A failed send is recorded on the invoice (FAILED + reason), so reload it.
    onError: () => void queryClient.invalidateQueries({ queryKey }),
  });

  return {
    send: (phone: string) => mutation.mutate(phone),
    sending: mutation.isPending,
    failure: mutation.error ? toFailure(mutation.error) : undefined,
    reset: mutation.reset,
  };
}
