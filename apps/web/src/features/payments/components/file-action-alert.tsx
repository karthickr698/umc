import { InlineAlert } from '@/components/feedback/inline-alert';
import { describeError } from '@/utils/describe-error';
import type { FileActionResult } from '../hooks/use-invoice-file-actions';

export interface FileActionAlertProps {
  result: FileActionResult;
  onDismiss: () => void;
}

/** Outcome of downloading or sharing an invoice PDF that needs the user's attention. */
export function FileActionAlert({ result, onDismiss }: FileActionAlertProps) {
  switch (result.kind) {
    case 'downloaded-for-share':
      return (
        <InlineAlert tone="success" title="PDF downloaded" onDismiss={onDismiss}>
          <p>Attach it in the WhatsApp chat that just opened, or share it from your downloads.</p>
        </InlineAlert>
      );
    case 'error':
      return (
        <InlineAlert tone="error" title="Could not get the PDF" onDismiss={onDismiss}>
          <p>{describeError(result.error).message}</p>
        </InlineAlert>
      );
    default:
      return null;
  }
}
