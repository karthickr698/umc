import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  INVOICE_STATUSES,
  INVOICE_WHATSAPP_STATUSES,
  type InvoiceDto,
  type Paginated,
} from '@umc/shared';
import { ApiClientError } from '@/lib/api-client';
import { apiQueryOptions } from '@/lib/query-client';
import { createInvoice, INVOICES_API, regenerateInvoice } from '../invoices-api';

const CONFLICT = 409;
const DELIVERY_POLL_MS = 10_000;
/** Delivery reports normally arrive within seconds; stop polling after this. */
const DELIVERY_POLL_WINDOW_MS = 5 * 60_000;

const AWAITING_DELIVERY = new Set<string>([
  INVOICE_WHATSAPP_STATUSES.QUEUED,
  INVOICE_WHATSAPP_STATUSES.SENT,
  INVOICE_WHATSAPP_STATUSES.DELIVERED,
]);

/** `details.invoiceId` of an API error, e.g. when the payment already has an invoice. */
function invoiceIdOf(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError)) return undefined;
  const { details } = error;
  if (typeof details !== 'object' || details === null || !('invoiceId' in details))
    return undefined;
  return typeof details.invoiceId === 'string' ? details.invoiceId : undefined;
}

function deliveryPollInterval(invoice: InvoiceDto | undefined): number | false {
  if (!invoice?.whatsappStatusAt || !AWAITING_DELIVERY.has(invoice.whatsappStatus)) return false;
  const age = Date.now() - Date.parse(invoice.whatsappStatusAt);
  return age < DELIVERY_POLL_WINDOW_MS ? DELIVERY_POLL_MS : false;
}

export function invoiceQueryKey(id: string) {
  return apiQueryOptions<InvoiceDto>(INVOICES_API.byId(id)).queryKey;
}

/** Issues the invoice, or re-renders it when it already exists (e.g. its PDF failed). */
async function issueOrRegenerate(paymentId: string, invoiceId?: string): Promise<InvoiceDto> {
  if (invoiceId) return regenerateInvoice(invoiceId);
  try {
    return await createInvoice({ paymentId });
  } catch (error) {
    const existingId = invoiceIdOf(error);
    if (existingId && error instanceof ApiClientError && error.status === CONFLICT) {
      return regenerateInvoice(existingId);
    }
    throw error;
  }
}

/**
 * The invoice the server issues with each payment: loads it, tracks its WhatsApp delivery, and
 * retries its generation when that failed.
 */
export function usePaymentInvoice(paymentId: string) {
  const queryClient = useQueryClient();
  const lookupOptions = apiQueryOptions<Paginated<InvoiceDto>>(INVOICES_API.byPayment(paymentId));
  const lookup = useQuery(lookupOptions);
  const found = lookup.data?.items[0];
  const invoiceId = found?.id;

  const query = useQuery({
    ...apiQueryOptions<InvoiceDto>(INVOICES_API.byId(invoiceId ?? '')),
    enabled: invoiceId !== undefined,
    initialData: () => found,
    refetchInterval: ({ state }) => deliveryPollInterval(state.data),
  });

  const retry = useMutation({
    mutationFn: () => issueOrRegenerate(paymentId, invoiceId),
    onSuccess: (invoice) => queryClient.setQueryData(invoiceQueryKey(invoice.id), invoice),
    // A failed create may still have stored the invoice (as FAILED); pick it up for the next retry.
    onSettled: () => queryClient.invalidateQueries({ queryKey: lookupOptions.queryKey }),
  });

  const invoice = query.data;
  const loading =
    retry.isPending || lookup.isPending || (invoiceId !== undefined && query.isPending);

  return {
    invoice,
    loading,
    error: retry.error ?? lookup.error ?? query.error ?? undefined,
    failed: !loading && invoice?.status !== INVOICE_STATUSES.GENERATED,
    retry: () => retry.mutate(),
  };
}
