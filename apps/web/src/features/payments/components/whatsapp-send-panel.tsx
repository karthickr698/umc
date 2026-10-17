import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { INVOICE_WHATSAPP_STATUSES, type InvoiceDto } from '@umc/shared';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Spinner } from '@/components/feedback/spinner';
import { FormField } from '@/components/forms/form-field';
import { useInvoiceWhatsapp } from '../hooks/use-invoice-whatsapp';

interface WhatsappSendPanelProps {
  invoice: InvoiceDto;
  /** Offered when sending is impossible or failed. */
  onShareManually: () => void;
}

function initialPhone(invoice: InvoiceDto): string {
  if (invoice.whatsappRecipient) return `+${invoice.whatsappRecipient}`;
  return invoice.recipientPhone ?? '';
}

/** Sends the PDF from the business WhatsApp number and shows the saved delivery status. */
export function WhatsappSendPanel({ invoice, onShareManually }: WhatsappSendPanelProps) {
  const [phone, setPhone] = useState(() => initialPhone(invoice));
  const { send, sending, failure, reset } = useInvoiceWhatsapp(invoice);
  const alreadySent = invoice.sentAt !== undefined;
  // The request's own error is more specific; the saved reason covers earlier and automatic sends.
  const savedError =
    !failure && invoice.whatsappStatus === INVOICE_WHATSAPP_STATUSES.FAILED
      ? invoice.whatsappError
      : undefined;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(phone);
  };

  const manualShare = (
    <button type="button" className="button button--small" onClick={onShareManually}>
      Share manually instead
    </button>
  );

  return (
    <form className="whatsapp-send" onSubmit={onSubmit} noValidate>
      <FormField
        label="WhatsApp number (with country code)"
        error={failure?.kind === 'invalid-phone' ? failure.message : undefined}
      >
        {(control) => (
          <input
            {...control}
            className="field__input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (failure?.kind === 'invalid-phone') reset();
            }}
          />
        )}
      </FormField>

      {failure?.kind === 'not-configured' && (
        <InlineAlert tone="warn" title="WhatsApp sending is not available" onDismiss={reset}>
          <p>{failure.message}</p>
          {manualShare}
        </InlineAlert>
      )}
      {failure?.kind === 'failed' && (
        <InlineAlert tone="error" title="Could not send on WhatsApp" onDismiss={reset}>
          <p>{failure.message}</p>
          {failure.retryable ? <p>You can try again in a moment.</p> : manualShare}
        </InlineAlert>
      )}
      {savedError && (
        <InlineAlert tone="error" title="Last WhatsApp send failed">
          <p>{savedError}</p>
          {manualShare}
        </InlineAlert>
      )}

      <button type="submit" className="button button--primary button--block" disabled={sending}>
        {sending ? <Spinner size={18} label="Sending" /> : <Send size={18} aria-hidden />}
        {sending ? 'Sending…' : alreadySent ? 'Send again' : 'Send on WhatsApp'}
      </button>
    </form>
  );
}
