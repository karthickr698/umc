import { StackedCell } from './stacked-cell';

/** Phone over email in a table cell; a dash when neither is known. */
export function ContactCell({ phone, email }: { phone?: string; email?: string }) {
  if (!phone && !email) return <>—</>;
  return <StackedCell primary={phone} secondary={email} />;
}
