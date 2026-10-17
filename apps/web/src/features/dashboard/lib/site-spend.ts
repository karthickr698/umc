import type { DashboardSiteTotals } from '@umc/shared';
import { totalOutflow } from './money-series';

export interface SiteSpendRow {
  id: string;
  name: string;
  workerPayments: number;
  contractorPayments: number;
  expenses: number;
  total: number;
}

const NO_SITE_ID = 'no-site';

function siteLabel({ siteId, siteName, siteCode }: DashboardSiteTotals): string {
  if (siteId === null) return 'Not tied to a site';
  if (siteName && siteCode) return `${siteName} (${siteCode})`;
  return siteName ?? siteCode ?? 'Unknown site';
}

/** Sites with any spend, highest total spend first. */
export function toSiteSpendRows(bySite: readonly DashboardSiteTotals[]): SiteSpendRow[] {
  return bySite
    .map((site) => ({
      id: site.siteId ?? NO_SITE_ID,
      name: siteLabel(site),
      workerPayments: site.workerPayments,
      contractorPayments: site.contractorPayments,
      expenses: site.expenses,
      total: totalOutflow(site),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);
}
