import { escapeHtml } from '../../utils/html.js';
import { formatAmount, formatCalendarDate, formatTimestamp } from './format.js';
import { INVOICE_RECEIPT_STYLES, invoiceReceiptFooter } from './invoice-receipt.styles.js';

export interface InvoiceReceiptWorkDay {
  /** `YYYY-MM-DD`. */
  date: string;
  /** Set when the invoice spans several sites. */
  siteName?: string;
  workType: string;
  statusLabel: string;
  dailyRate: number;
}

/** Everything printed on a payment receipt, already resolved to display values. */
export interface InvoiceReceiptView {
  company: { name: string; phone?: string; email?: string; address?: string };
  invoiceNumber: string;
  /** `YYYY-MM-DD`. */
  invoiceDate: string;
  recipient: {
    name: string;
    code?: string;
    typeLabel: string;
    role?: string;
    phone?: string;
    contractorName?: string;
  };
  site?: { name: string; code: string; address?: string };
  payment: {
    /** `YYYY-MM-DD`. */
    date: string;
    typeLabel: string;
    modeLabel: string;
    referenceNumber?: string;
    amount: number;
  };
  workDetails?: string;
  workPeriod?: { from: string; to: string; days: InvoiceReceiptWorkDay[] };
  notes?: string;
  generatedAt: Date;
}

type Fact = [label: string, value: string | undefined];

function facts(rows: Fact[]): string {
  const cells = rows
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
    .join('');
  return `<table class="facts">${cells}</table>`;
}

function companyLines({ company }: InvoiceReceiptView): string {
  const contact = [company.phone, company.email].filter(Boolean).join('  ·  ');
  return [company.address, contact]
    .filter((line): line is string => Boolean(line))
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

function recipientCard({ recipient }: InvoiceReceiptView): string {
  return `
    <div class="card">
      <div class="card__title">Paid to</div>
      <div class="card__name">${escapeHtml(recipient.name)}</div>
      ${facts([
        ['Worker code', recipient.code],
        ['Worker type', recipient.typeLabel],
        ['Role / trade', recipient.role],
        ['Contractor', recipient.contractorName],
        ['Phone', recipient.phone],
      ])}
    </div>`;
}

function siteCard({ site }: InvoiceReceiptView): string {
  const body = site
    ? `<div class="card__name">${escapeHtml(site.name)}</div>
       ${facts([
         ['Site code', site.code],
         ['Address', site.address],
       ])}`
    : '<p class="muted">Not tied to a specific site</p>';
  return `<div class="card"><div class="card__title">Site</div>${body}</div>`;
}

function workPeriodTable(period: NonNullable<InvoiceReceiptView['workPeriod']>): string {
  const range = `${formatCalendarDate(period.from)} – ${formatCalendarDate(period.to)}`;
  if (period.days.length === 0) {
    return `<p class="muted">No work days recorded for ${escapeHtml(range)}.</p>`;
  }
  const showSite = period.days.some((day) => day.siteName !== undefined);
  const rows = period.days
    .map(
      (day) => `<tr>
        <td>${escapeHtml(formatCalendarDate(day.date))}</td>
        ${showSite ? `<td>${escapeHtml(day.siteName ?? '—')}</td>` : ''}
        <td>${escapeHtml(day.workType)}</td>
        <td>${escapeHtml(day.statusLabel)}</td>
        <td class="num mono">${formatAmount(day.dailyRate)}</td>
      </tr>`,
    )
    .join('');
  const total = period.days.reduce((sum, day) => sum + day.dailyRate, 0);
  const dayCount = `${period.days.length} day${period.days.length === 1 ? '' : 's'}`;
  return `
    <p class="muted" style="margin-bottom:6px">Work period: ${escapeHtml(range)}</p>
    <table class="grid">
      <thead><tr>
        <th>Date</th>${showSite ? '<th>Site</th>' : ''}<th>Work type</th><th>Status</th>
        <th class="num">Daily rate</th>
      </tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr>
        <td colspan="${showSite ? 4 : 3}">Earned over ${dayCount}</td>
        <td class="num mono">${formatAmount(total)}</td>
      </tr></tfoot>
    </table>`;
}

function workSection(view: InvoiceReceiptView): string {
  if (!view.workDetails && !view.workPeriod) return '';
  return `
    <section class="section">
      <h3>Work details</h3>
      ${view.workDetails ? `<p class="text-block">${escapeHtml(view.workDetails)}</p>` : ''}
      ${view.workPeriod ? `<div style="margin-top:${view.workDetails ? 10 : 0}px">${workPeriodTable(view.workPeriod)}</div>` : ''}
    </section>`;
}

/** A complete, self-contained HTML document for one payment receipt. */
export function renderInvoiceReceiptHtml(view: InvoiceReceiptView): string {
  const { payment } = view;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(`Payment receipt ${view.invoiceNumber}`)}</title>
  <style>${INVOICE_RECEIPT_STYLES}</style>
</head>
<body>
  <header class="header">
    <div class="header__company">
      <h1>${escapeHtml(view.company.name)}</h1>
      ${companyLines(view)}
    </div>
    <div class="header__doc">
      <h2>Payment receipt</h2>
      <dl>
        <dt>Invoice no.</dt><dd>${escapeHtml(view.invoiceNumber)}</dd>
        <dt>Date</dt><dd>${escapeHtml(formatCalendarDate(view.invoiceDate))}</dd>
      </dl>
    </div>
  </header>

  <span class="stamp">PAID</span>

  <div class="parties">${recipientCard(view)}${siteCard(view)}</div>

  <section class="section">
    <h3>Payment details</h3>
    ${facts([
      ['Payment date', formatCalendarDate(payment.date)],
      ['Payment type', payment.typeLabel],
      ['Payment mode', payment.modeLabel],
      ['Reference no.', payment.referenceNumber],
    ])}
  </section>

  ${workSection(view)}

  <div class="total">
    <div>
      <div class="total__label">Amount paid</div>
      <div class="total__mode">via ${escapeHtml(payment.modeLabel)}</div>
    </div>
    <div class="total__amount mono">${formatAmount(payment.amount)}</div>
  </div>

  ${
    view.notes
      ? `<section class="section"><h3>Notes</h3><p class="text-block">${escapeHtml(view.notes)}</p></section>`
      : ''
  }

  <div class="signatures">
    <div class="signature"><div class="signature__line">Received by (${escapeHtml(view.recipient.name)})</div></div>
    <div class="signature"><div class="signature__line">Authorised signatory, ${escapeHtml(view.company.name)}</div></div>
  </div>

  <p class="footnote">Generated on ${escapeHtml(formatTimestamp(view.generatedAt))}. This receipt was generated electronically.</p>
</body>
</html>`;
}

export function renderInvoiceReceiptFooter(view: InvoiceReceiptView): string {
  return invoiceReceiptFooter(escapeHtml(`${view.company.name} · Receipt ${view.invoiceNumber}`));
}
