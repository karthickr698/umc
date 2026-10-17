import { useState } from 'react';
import { Construction } from 'lucide-react';
import { QueryResult } from '@/components/data/query-result';
import { EmptyState } from '@/components/feedback/empty-state';
import { PageContainer } from '@/components/layout/page-container';
import { PaymentEntryForm } from './components/payment-entry-form';
import { PaymentSuccess } from './components/payment-success';
import { usePaymentReference } from './hooks/use-payment-reference';
import type { PaymentEntryDefaults } from './lib/payment-entry-schema';
import { readPaymentPreferences } from './lib/payment-preferences';
import type { PaymentReceipt } from './lib/payment-receipt';

export function PaymentEntryPage() {
  const reference = usePaymentReference();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const [initial, setInitial] = useState<PaymentEntryDefaults>(readPaymentPreferences);
  // Bumped for every new entry so the form remounts with fresh defaults.
  const [entryKey, setEntryKey] = useState(0);

  const startNewPayment = () => {
    if (receipt) {
      const { siteId, paymentMode, paymentDate } = receipt.payment;
      setInitial({ siteId, paymentMode, paymentDate });
    }
    setReceipt(null);
    setEntryKey((key) => key + 1);
  };

  return (
    <PageContainer title="Pay workers" description="Pay a worker or contractor in a few taps.">
      <div className="payment-entry-page">
        {receipt ? (
          <PaymentSuccess receipt={receipt} onNewPayment={startNewPayment} />
        ) : (
          <QueryResult query={reference}>
            {(data) =>
              data.siteOptions.length === 0 ? (
                <EmptyState
                  icon={Construction}
                  title="No sites yet"
                  message="Payments are recorded against a site. Add a site first."
                />
              ) : (
                <PaymentEntryForm
                  key={entryKey}
                  reference={data}
                  initial={initial}
                  onSaved={setReceipt}
                />
              )
            }
          </QueryResult>
        )}
      </div>
    </PageContainer>
  );
}
