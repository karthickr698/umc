import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '@umc/shared';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ meta, onPageChange, disabled = false }: PaginationProps) {
  const { page, pageSize, total, totalPages } = meta;
  if (total === 0) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav className="pagination" aria-label="Pagination">
      <p className="pagination__summary">
        {first}–{last} of {total}
      </p>
      <div className="pagination__buttons">
        <button
          type="button"
          className="button"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeft size={16} aria-hidden />
          Previous
        </button>
        <button
          type="button"
          className="button"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
