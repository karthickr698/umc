import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { CircleCheck, Plus } from 'lucide-react';
import { DescriptionList } from '@/components/data/description-list';
import { APP_ROUTES } from '@/config/routes';
import { formatAmount } from '@/utils/format';
import { receiptDetails, type PaymentReceipt } from '../lib/payment-receipt';
import { ReceiptActions } from './receipt-actions';

export interface PaymentSuccessProps {
  receipt: PaymentReceipt;
  onNewPayment: () => void;
}

/** Doubles as the printable invoice: everything outside `.payment-receipt` is hidden in print. */
export function PaymentSuccess({ receipt, onNewPayment }: PaymentSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <section
      className="payment-success payment-receipt card"
      aria-labelledby="payment-success-title"
    >
      <div className="payment-success__hero">
        <CircleCheck className="payment-success__icon" size={48} aria-hidden />
        <h2
          id="payment-success-title"
          className="payment-success__title"
          ref={headingRef}
          tabIndex={-1}
        >
          Payment successful
        </h2>
        <p className="payment-success__amount">{formatAmount(receipt.payment.amount)}</p>
        <dl className="payment-success__party">
          <div>
            <dt>Worker</dt>
            <dd>
              {receipt.workerName}{' '}
              <span className="payment-success__code">{receipt.workerCode}</span>
            </dd>
          </div>
          <div>
            <dt>Site</dt>
            <dd>{receipt.siteName}</dd>
          </div>
        </dl>
      </div>

      <DescriptionList items={receiptDetails(receipt)} />

      <ReceiptActions receipt={receipt} />

      <div className="payment-success__next no-print">
        <button
          type="button"
          className="button button--primary button--block"
          onClick={onNewPayment}
        >
          <Plus size={18} aria-hidden />
          New payment
        </button>
        <Link to={APP_ROUTES.dashboard} className="button button--ghost button--block">
          Done
        </Link>
      </div>
    </section>
  );
}
