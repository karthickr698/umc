import {
  HandCoins,
  HardHat,
  type LucideIcon,
  Package,
  Receipt,
  Scale,
  Users,
  Wallet,
} from 'lucide-react';
import type { SiteFinancialTotals } from '@umc/shared';
import { StatCard, type StatTone } from '@/components/data/stat-card';
import { ReportAmount } from './report-amount';

interface CardDefinition {
  key: keyof SiteFinancialTotals;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: StatTone;
}

const CARDS: readonly CardDefinition[] = [
  {
    key: 'clientReceipts',
    label: 'Client receipts',
    hint: 'Money received from clients',
    icon: HandCoins,
    tone: 'positive',
  },
  {
    key: 'employeePayments',
    label: 'Employee payments',
    hint: 'Wages and advances to own staff',
    icon: Users,
    tone: 'warn',
  },
  {
    key: 'contractorPayments',
    label: 'Contractor payments',
    hint: "Paid to contractors' workers",
    icon: HardHat,
    tone: 'warn',
  },
  {
    key: 'materialExpenses',
    label: 'Material expenses',
    hint: 'Building materials',
    icon: Package,
    tone: 'info',
  },
  {
    key: 'otherExpenses',
    label: 'Other expenses',
    hint: 'Transport, equipment and the rest',
    icon: Receipt,
    tone: 'info',
  },
  {
    key: 'totalExpenses',
    label: 'Total expenses',
    hint: 'All payments and expenses',
    icon: Wallet,
    tone: 'negative',
  },
  {
    key: 'balance',
    label: 'Balance',
    hint: 'Receipts minus total expenses',
    icon: Scale,
    tone: 'neutral',
  },
];

export interface SiteReportSummaryProps {
  /** Placeholders are shown until the totals arrive. */
  totals?: SiteFinancialTotals;
}

export function SiteReportSummary({ totals }: SiteReportSummaryProps) {
  return (
    <div className="summary-cards summary-cards--wide">
      {CARDS.map(({ key, label, hint, icon, tone }) => (
        <StatCard
          key={key}
          label={label}
          icon={icon}
          tone={tone}
          loading={!totals}
          value={<ReportAmount value={totals?.[key] ?? 0} />}
          hint={hint}
        />
      ))}
    </div>
  );
}
