/** Print stylesheet of the payment receipt; system fonts only, since the page cannot fetch any. */
export const INVOICE_RECEIPT_STYLES = `
@page { size: A4; margin: 14mm 14mm 18mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  margin: 0;
  color: #1f2933;
  font: 10pt/1.45 'Inter', 'Segoe UI', 'Helvetica Neue', Arial, 'Liberation Sans', 'DejaVu Sans', sans-serif;
}
h1, h2, h3, p { margin: 0; }
.muted { color: #616e7c; }
.mono { font-variant-numeric: tabular-nums; }

.header {
  display: flex; justify-content: space-between; align-items: stretch; gap: 16px;
  border-radius: 8px; overflow: hidden; background: #102a43; color: #fff;
}
.header__company { padding: 16px 18px; flex: 1; }
.header__company h1 { font-size: 17pt; letter-spacing: 0.2px; }
.header__company p { color: #bcccdc; font-size: 9pt; margin-top: 2px; }
.header__doc {
  background: #f0b429; color: #102a43; padding: 16px 18px; min-width: 210px; text-align: right;
}
.header__doc h2 { font-size: 13pt; letter-spacing: 1.5px; text-transform: uppercase; }
.header__doc dl { margin: 8px 0 0; display: grid; grid-template-columns: auto auto; gap: 2px 10px; }
.header__doc dt { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.6px; }
.header__doc dd { margin: 0; font-weight: 700; }

.stamp {
  display: inline-block; margin: 10px 0 2px; padding: 3px 10px; border: 1.5px solid #2f8132;
  border-radius: 4px; color: #2f8132; font-weight: 700; font-size: 9pt; letter-spacing: 1.2px;
}

.parties { display: flex; gap: 12px; margin-top: 10px; }
.card { flex: 1; border: 1px solid #d9e2ec; border-radius: 8px; padding: 10px 14px; }
.card__title {
  font-size: 8pt; font-weight: 700; color: #486581; text-transform: uppercase;
  letter-spacing: 0.8px; margin-bottom: 6px;
}
.card__name { font-size: 12pt; font-weight: 700; }

.facts { width: 100%; border-collapse: collapse; }
.facts th { text-align: left; font-weight: 500; color: #616e7c; padding: 2px 10px 2px 0; width: 130px; vertical-align: top; }
.facts td { padding: 2px 0; font-weight: 600; }

.section { margin-top: 12px; break-inside: avoid; }
.section h3 {
  font-size: 9pt; font-weight: 700; color: #102a43; text-transform: uppercase; letter-spacing: 0.8px;
  padding-bottom: 4px; border-bottom: 2px solid #f0b429; margin-bottom: 8px;
}
.text-block { white-space: pre-wrap; word-break: break-word; }

.grid { width: 100%; border-collapse: collapse; font-size: 9pt; }
.grid th {
  background: #f0f4f8; color: #334e68; text-align: left; font-weight: 700;
  padding: 5px 8px; border-bottom: 1px solid #d9e2ec;
}
.grid td { padding: 3px 8px; border-bottom: 1px solid #edf1f5; }
.grid tr { break-inside: avoid; }
.grid .num { text-align: right; }
.grid tfoot td { font-weight: 700; background: #f8fafc; border-bottom: none; }

.total {
  display: flex; justify-content: space-between; align-items: center; margin-top: 14px;
  padding: 14px 18px; border-radius: 8px; background: #102a43; color: #fff; break-inside: avoid;
}
.total__label { font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; color: #bcccdc; }
.total__mode { font-size: 9pt; color: #f0b429; margin-top: 2px; }
.total__amount { font-size: 20pt; font-weight: 800; }

.signatures { display: flex; justify-content: space-between; gap: 40px; margin-top: 36px; break-inside: avoid; }
.signature { flex: 1; text-align: center; }
.signature__line { border-top: 1px solid #9aa5b1; padding-top: 6px; font-size: 9pt; color: #52606d; }

.footnote { margin-top: 12px; font-size: 8pt; color: #7b8794; text-align: center; }
`;

/**
 * Puppeteer footer; it renders outside the page's stylesheet, so styles must be inline.
 * `label` must already be HTML-escaped.
 */
export function invoiceReceiptFooter(label: string): string {
  return `
<div style="width:100%;padding:0 14mm;font:7.5pt Arial,sans-serif;color:#7b8794;display:flex;justify-content:space-between;">
  <span>${label}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;
}
