import { useState } from 'react';
import { saveFile } from '@/lib/save-file';
import type { ReportFile } from '../reports-api';

/** Runs `download` (a report CSV export) and saves the file it returns. */
export function useCsvExport(download: () => Promise<ReportFile>) {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<unknown>(undefined);

  const run = async () => {
    setExporting(true);
    setError(undefined);
    try {
      const { blob, fileName } = await download();
      saveFile(blob, fileName);
    } catch (caught) {
      setError(caught);
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    error,
    exportCsv: () => void run(),
    clearError: () => setError(undefined),
  };
}
