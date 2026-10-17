import type { ComponentType, ReactNode } from 'react';
import { Plus, type LucideIcon } from 'lucide-react';
import type { Paginated } from '@umc/shared';
import { DataTable, type DataTableColumn } from '@/components/data/data-table';
import { QueryResult } from '@/components/data/query-result';
import { RowActions } from '@/components/data/row-actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { InlineAlert } from '@/components/feedback/inline-alert';
import { Drawer } from '@/components/layout/drawer';
import { PageContainer } from '@/components/layout/page-container';
import type { ApiQuery } from '@/hooks/use-api-query';
import { useResourceEditor } from '@/hooks/use-resource-editor';
import type { ResourceApi } from '@/lib/resource-api';

/** Contract of the add/edit form a list page shows in its drawer. */
export interface ResourceFormProps<T> {
  /** The record being edited; absent when adding a new one. */
  item?: T;
  onSaved: (saved: T) => void;
  onCancel: () => void;
}

/** What a list page is for, shown while it has no records yet. */
export interface ResourceIntro {
  icon: LucideIcon;
  title: string;
  message: string;
}

export interface ResourceListViewProps<T extends { id: string }> {
  title: string;
  description: string;
  /** Singular, lower-case, e.g. "client"; used in buttons and messages. */
  noun: string;
  /** Label of the add button; defaults to "Add <noun>". */
  addLabel?: string;
  api: ResourceApi;
  list: ApiQuery<Paginated<T>>;
  /** Filter controls shown above the table. */
  filters?: ReactNode;
  /** Page-specific messages shown above the filters, e.g. the outcome of a row action. */
  banner?: ReactNode;
  /** Whether any filter is applied; an unfiltered, empty list shows `intro` instead. */
  filtered: boolean;
  intro: ResourceIntro;
  onPageChange: (page: number) => void;
  columns: readonly DataTableColumn<T>[];
  /** Whether the user may add, edit and delete; otherwise the list is read-only. */
  canManage: boolean;
  itemName: (item: T) => string;
  Form: ComponentType<ResourceFormProps<T>>;
}

/** A paginated list of records with add, edit and delete in a side drawer. */
export function ResourceListView<T extends { id: string }>({
  title,
  description,
  noun,
  addLabel = `Add ${noun}`,
  api,
  list,
  filters,
  banner,
  filtered,
  intro,
  onPageChange,
  columns,
  canManage,
  itemName,
  Form,
}: ResourceListViewProps<T>) {
  const editor = useResourceEditor<T>(api);
  const open = editor.editor;

  const addButton = canManage && (
    <button type="button" className="button button--primary" onClick={editor.openCreate}>
      <Plus size={18} aria-hidden />
      {addLabel}
    </button>
  );

  const allColumns: readonly DataTableColumn<T>[] = canManage
    ? [
        ...columns,
        {
          id: 'actions',
          header: 'Actions',
          render: (item) => (
            <RowActions
              itemLabel={`${noun} ${itemName(item)}`}
              deleting={editor.deletingId === item.id}
              onEdit={() => editor.openEdit(item)}
              onDelete={() => editor.handleDelete(item, `${noun} "${itemName(item)}"`)}
            />
          ),
        },
      ]
    : columns;

  return (
    <PageContainer title={title} description={description} actions={addButton}>
      <div className="stack stack--tight">
        {editor.notice && (
          <InlineAlert
            tone={editor.notice.tone}
            title={editor.notice.tone === 'success' ? 'Done' : `Could not delete ${noun}`}
            onDismiss={editor.dismissNotice}
          >
            {editor.notice.message}
          </InlineAlert>
        )}
        {banner}
        {filters}
        <QueryResult query={list}>
          {(result) =>
            result.meta.total === 0 && !filtered ? (
              <div className="card">
                <EmptyState
                  icon={intro.icon}
                  title={intro.title}
                  message={intro.message}
                  action={addButton}
                />
              </div>
            ) : (
              <DataTable
                result={result}
                columns={allColumns}
                loading={list.loading}
                emptyMessage={`No ${noun}s match these filters.`}
                onPageChange={onPageChange}
              />
            )
          }
        </QueryResult>
      </div>

      <Drawer
        open={open !== null}
        title={open?.item ? `Edit ${noun}` : addLabel}
        description={open?.item && itemName(open.item)}
        onClose={editor.closeEditor}
      >
        {open && (
          <Form
            key={open.item?.id ?? 'new'}
            item={open.item}
            onSaved={(saved) => editor.handleSaved(`${noun} "${itemName(saved)}"`)}
            onCancel={editor.closeEditor}
          />
        )}
      </Drawer>
    </PageContainer>
  );
}
