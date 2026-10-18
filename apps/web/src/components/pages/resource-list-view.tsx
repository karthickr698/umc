import type { ComponentType, ReactNode } from 'react';
import { Pencil, Plus, type LucideIcon } from 'lucide-react';
import type { Paginated } from '@umc/shared';
import { DataTable, type DataTableColumn } from '@/components/data/data-table';
import { QueryResult } from '@/components/data/query-result';
import { RowActions } from '@/components/data/row-actions';
import { EmptyState } from '@/components/feedback/empty-state';
import { Drawer } from '@/components/layout/drawer';
import { PageContainer } from '@/components/layout/page-container';
import type { ApiQuery } from '@/hooks/use-api-query';
import { useCreateRequest } from '@/hooks/use-create-request';
import { useResourceEditor } from '@/hooks/use-resource-editor';
import type { ResourceApi } from '@/lib/resource-api';
import { ResourceDeleteDialog } from './resource-delete-dialog';

/** Contract of the add/edit form a list page shows in its drawer. */
export interface ResourceFormProps<T> {
  /** The record being edited; absent when adding a new one. */
  item?: T;
  onSaved: (saved: T) => void;
  onCancel: () => void;
}

/** Contract of the read-only details a list page shows in its drawer. */
export interface ResourceDetailsProps<T> {
  item: T;
  /** Opens the edit form; absent when the user may not edit. */
  onEdit?: () => void;
  /** Closes the drawer, e.g. before opening a related panel. */
  onClose: () => void;
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
  /** When given, each row gets a "View" action that shows these details, even to read-only users. */
  Details?: ComponentType<ResourceDetailsProps<T>>;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
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
  Details,
}: ResourceListViewProps<T>) {
  const editor = useResourceEditor<T>(api);
  useCreateRequest(editor.openCreate, canManage);
  const open = editor.editor;
  const describe = (item: T) => `${noun} "${itemName(item)}"`;

  const addButton = canManage && (
    <button type="button" className="button button--primary" onClick={editor.openCreate}>
      <Plus size={18} aria-hidden />
      {addLabel}
    </button>
  );

  const allColumns: readonly DataTableColumn<T>[] =
    canManage || Details
      ? [
          ...columns,
          {
            id: 'actions',
            header: 'Actions',
            mobile: 'actions',
            render: (item) => (
              <RowActions
                itemLabel={`${noun} ${itemName(item)}`}
                deleting={editor.deletingId === item.id}
                onView={Details && (() => editor.openView(item))}
                onEdit={canManage ? () => editor.openEdit(item) : undefined}
                onDelete={canManage ? () => editor.requestDelete(item, describe(item)) : undefined}
              />
            ),
          },
        ]
      : columns;

  const drawerTitle = !open
    ? ''
    : open.mode === 'view'
      ? `${capitalize(noun)} details`
      : open.mode === 'edit'
        ? `Edit ${noun}`
        : addLabel;

  return (
    <PageContainer title={title} description={description} actions={addButton}>
      <div className="stack stack--tight">
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
        title={drawerTitle}
        description={open?.mode === 'edit' && itemName(open.item)}
        onClose={editor.closeEditor}
      >
        {open?.mode === 'view' && Details && (
          <div className="resource-details">
            <Details
              item={open.item}
              onEdit={canManage ? () => editor.openEdit(open.item) : undefined}
              onClose={editor.closeEditor}
            />
            <footer className="entity-form__footer">
              <div className="entity-form__primary">
                <button type="button" className="button" onClick={editor.closeEditor}>
                  Close
                </button>
                {canManage && (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => editor.openEdit(open.item)}
                  >
                    <Pencil size={16} aria-hidden />
                    Edit {noun}
                  </button>
                )}
              </div>
            </footer>
          </div>
        )}
        {open && open.mode !== 'view' && (
          <Form
            key={open.mode === 'edit' ? open.item.id : 'new'}
            item={open.mode === 'edit' ? open.item : undefined}
            onSaved={(saved) => editor.handleSaved(describe(saved), open.mode === 'create')}
            onCancel={editor.closeEditor}
          />
        )}
      </Drawer>

      <ResourceDeleteDialog
        noun={noun}
        pendingDelete={editor.pendingDelete}
        itemName={itemName}
        deleting={editor.deleting}
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </PageContainer>
  );
}
