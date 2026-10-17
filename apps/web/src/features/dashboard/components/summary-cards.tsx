import { HandCoins, HardHat, type LucideIcon, Receipt, Scale, Users } from 'lucide-react';
import type { DashboardTotals } from '@umc/shared';
import { StatCard, type StatTone } from '@/components/data/stat-card';
import { formatAmount } from '@/utils/format';
import { MONEY_SERIES, totalOutflow } from '../lib/money-series';

interface CardDefinition {
  key: keyof DashboardTotals;
  label: string;
  icon: LucideIcon;
  tone: StatTone;
}

const CARDS: readonly CardDefinition[] = [
  { ...MONEY_SERIES.clientPaymentsReceived, icon: HandCoins, tone: 'positive' },
  { ...MONEY_SERIES.workerPayments, icon: Users, tone: 'warn' },
  { ...MONEY_SERIES.contractorPayments, icon: HardHat, tone: 'info' },
  { ...MONEY_SERIES.expenses, icon: Receipt, tone: 'negative' },
  { key: 'balance', label: 'Balance', icon: Scale, tone: 'neutral' },
];

function hintFor(key: keyof DashboardTotals, totals: DashboardTotals): string {
  if (key === 'clientPaymentsReceived') return 'Money received from clients';
  if (key === 'balance') return 'Receipts minus payments and expenses';
  const outflow = totalOutflow(totals);
  if (outflow === 0) return 'Nothing paid out';
  return `${Math.round((totals[key] / outflow) * 100)}% of money paid out`;
}

export interface SummaryCardsProps {
  /** Placeholders are shown until the totals arrive. */
  totals?: DashboardTotals;
}

export function SummaryCards({ totals }: SummaryCardsProps) {
  return (
    <div className="summary-cards">
      {CARDS.map(({ key, label, icon, tone }) => {
        const amount = totals?.[key] ?? 0;
        const negativeBalance = key === 'balance' && amount < 0;
        return (
          <StatCard
            key={key}
            label={label}
            icon={icon}
            tone={key === 'balance' ? (negativeBalance ? 'negative' : 'positive') : tone}
            loading={!totals}
            value={
              <span className={negativeBalance ? 'amount--negative' : undefined}>
                {formatAmount(amount)}
              </span>
            }
            hint={totals && hintFor(key, totals)}
          />
        );
      })}
    </div>
  );
}
