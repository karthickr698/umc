import { Download } from 'lucide-react';
import { Spinner } from '@/components/feedback/spinner';

export interface CsvExportButtonProps {
  exporting: boolean;
  onExport: () => void;
}

export function CsvExportButton({ exporting, onExport }: CsvExportButtonProps) {
  return (
    <button
      type="button"
      className="button button--primary"
      onClick={onExport}
      disabled={exporting}
    >
      {exporting ? <Spinner size={16} label="Exporting" /> : <Download size={16} aria-hidden />}
      Export CSV
    </button>
  );
}
