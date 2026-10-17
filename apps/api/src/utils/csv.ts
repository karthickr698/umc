import { Readable } from 'node:stream';
import type { FileDownload } from './send-file.js';

export const CSV_CONTENT_TYPE = 'text/csv; charset=utf-8';

export type CsvCell = string | number;

// Lets Excel detect UTF-8, so non-ASCII names are not garbled.
const UTF8_BOM = '\uFEFF';
const LINE_BREAK = '\r\n';
const NEEDS_QUOTES = /[",\r\n]/;
// Spreadsheets run text cells starting with these as formulas (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

function formatCell(cell: CsvCell): string {
  if (typeof cell === 'number') return String(cell);
  const text = FORMULA_START.test(cell) ? `'${cell}` : cell;
  return NEEDS_QUOTES.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** RFC 4180 CSV with a header row; text cells are escaped and neutralised against formulas. */
export function toCsv(header: readonly string[], rows: readonly (readonly CsvCell[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(formatCell).join(','));
  return `${UTF8_BOM}${lines.join(LINE_BREAK)}${LINE_BREAK}`;
}

/** ASCII-only, e.g. `worker-financial-report-from-2026-10-01-to-2026-10-31.csv`. */
export function csvFileName(prefix: string, { from, to }: { from?: string; to?: string }): string {
  const range = [from && `from-${from}`, to && `to-${to}`].filter(Boolean).join('-');
  return `${prefix}${range && `-${range}`}.csv`;
}

/** A CSV file ready for `sendFile`, once given a disposition. */
export function toCsvDownload(
  fileName: string,
  header: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): Omit<FileDownload, 'disposition'> {
  const body = Buffer.from(toCsv(header, rows), 'utf8');
  return {
    body: Readable.from([body]),
    size: body.length,
    contentType: CSV_CONTENT_TYPE,
    fileName,
  };
}
