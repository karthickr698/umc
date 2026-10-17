import { CalendarCheck, HandCoins, type LucideIcon, Scale, Users, Wallet } from 'lucide-react';
import type { WorkerFinancialReportDto } from '@umc/shared';
import { StatCard, type StatTone } from '@/components/data/stat-card';
import { formatAmount } from '@/utils/format';

type ReportTotals = WorkerFinancialReportDto['totals'];

interface CardDefinition {
  key: keyof ReportTotals;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: StatTone;
  money: boolean;
}

const CARDS: readonly CardDefinition[] = [
  {
    key: 'workerCount',
    label: 'Workers',
    hint: 'With work or payments in range',
    icon: Users,
    tone: 'neutral',
    money: false,
  },
  {
    key: 'assignedDays',
    label: 'Work days',
    hint: 'Scheduled and completed days',
    icon: CalendarCheck,
    tone: 'info',
    money: false,
  },
  {
    key: 'earnedAmount',
    label: 'Earned',
    hint: 'Sum of daily rates worked',
    icon: HandCoins,
    tone: 'positive',
    money: true,
  },
  {
    key: 'paidAmount',
    label: 'Paid',
    hint: 'Wages, advances and other payments',
    icon: Wallet,
    tone: 'warn',
    money: true,
  },
  {
    key: 'outstandingAmount',
    label: 'Outstanding',
    hint: 'Earned minus paid',
    icon: Scale,
    tone: 'negative',
    money: true,
  },
];

export interface WorkerReportSummaryProps {
  /** Placeholders are shown until the totals arrive. */
  totals?: ReportTotals;
}

export function WorkerReportSummary({ totals }: WorkerReportSummaryProps) {
  return (
    <div className="summary-cards">
      {CARDS.map(({ key, label, hint, icon, tone, money }) => {
        const value = totals?.[key] ?? 0;
        return (
          <StatCard
            key={key}
            label={label}
            icon={icon}
            tone={tone}
            loading={!totals}
            value={
              <span className={value < 0 ? 'amount--negative' : undefined}>
                {money ? formatAmount(value) : value}
              </span>
            }
            hint={hint}
          />
        );
      })}
    </div>
  );
}
