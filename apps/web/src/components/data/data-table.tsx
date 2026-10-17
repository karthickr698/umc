import type { ReactNode } from 'react';
import type { Paginated } from '@umc/shared';
import { Pagination } from './pagination';

export interface DataTableColumn<T> {
  /** Unique per table; used as the React key. */
  id: string;
  header: string;
  render: (item: T) => ReactNode;
  numeric?: boolean;
}

export interface DataTableProps<T extends { id: string }> {
  result: Paginated<T>;
  columns: readonly DataTableColumn<T>[];
  loading: boolean;
  emptyMessage: string;
  onPageChange: (page: number) => void;
}

/** One page of records as a table card, with pagination below; rows become cards on phones. */
export function DataTable<T extends { id: string }>({
  result,
  columns,
  loading,
  emptyMessage,
  onPageChange,
}: DataTableProps<T>) {
  const numericClass = (column: DataTableColumn<T>) =>
    column.numeric ? 'table__numeric' : undefined;

  return (
    <div className="card table-card" aria-busy={loading}>
      <div className="table-scroll">
        <table className="table table--stacked">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.id} scope="col" className={numericClass(column)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((item) => (
              <tr key={item.id}>
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={numericClass(column)}
                    data-label={column.header}
                    data-column={column.id}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {result.items.length === 0 && <p className="table-message">{emptyMessage}</p>}
      </div>
      <Pagination meta={result.meta} onPageChange={onPageChange} disabled={loading} />
    </div>
  );
}
