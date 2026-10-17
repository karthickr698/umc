import { InlineAlert } from '@/components/feedback/inline-alert';
import type { AllocationNotice } from '../lib/notices';

export interface AllocationNoticeAlertProps {
  notice: AllocationNotice;
  onDismiss: () => void;
}

export function AllocationNoticeAlert({ notice, onDismiss }: AllocationNoticeAlertProps) {
  return (
    <InlineAlert tone={notice.tone} title={notice.title} onDismiss={onDismiss}>
      {notice.details && (
        <ul className="inline-alert__list">
          {notice.details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </InlineAlert>
  );
}
