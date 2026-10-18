import { ArrowLeft, Pencil } from 'lucide-react';
import type { ContractorDto, ContractorEmployeeDto } from '@umc/shared';
import { Drawer } from '@/components/layout/drawer';
import { ResourceDeleteDialog } from '@/components/pages/resource-delete-dialog';
import { useCan } from '@/hooks/use-can';
import { useResourceEditor } from '@/hooks/use-resource-editor';
import { RESOURCE_API } from '@/lib/resource-api';
import { humanizeEnum } from '@/utils/format';
import { ContractorEmployeeForm } from './contractor-employee-form';
import { ContractorWorkerDetails } from './contractor-worker-details';
import { ContractorWorkersList } from './contractor-workers-list';

export interface ContractorWorkersDrawerProps {
  contractor: ContractorDto;
  /** Opens straight on the add form instead of the list. */
  startAdding?: boolean;
  onClose: () => void;
}

const workerName = (worker: ContractorEmployeeDto) => worker.name;
const describe = (worker: ContractorEmployeeDto) => `worker "${worker.name}"`;

/** A contractor's workers in a side panel: list, details, add, edit and delete. */
export function ContractorWorkersDrawer({
  contractor,
  startAdding = false,
  onClose,
}: ContractorWorkersDrawerProps) {
  const canManage = useCan('manageContractorEmployees');
  const editor = useResourceEditor<ContractorEmployeeDto>(
    RESOURCE_API.contractorEmployees,
    startAdding ? { mode: 'create' } : null,
  );
  const open = editor.editor;

  const title = !open
    ? 'Workers'
    : open.mode === 'view'
      ? 'Worker details'
      : open.mode === 'edit'
        ? 'Edit worker'
        : 'Add worker';

  const backButton = open && (
    <button type="button" className="button button--small" onClick={editor.closeEditor}>
      <ArrowLeft size={14} aria-hidden />
      All workers
    </button>
  );

  return (
    <>
      <Drawer
        open
        title={title}
        description={
          open
            ? `${contractor.name} · ${humanizeEnum(contractor.category)}`
            : 'Everyone this contractor sends to your sites'
        }
        actions={backButton}
        onClose={() => {
          if (!editor.pendingDelete) onClose();
        }}
      >
        {!open && (
          <ContractorWorkersList
            contractor={contractor}
            deletingId={editor.deletingId}
            onView={editor.openView}
            onAdd={canManage ? editor.openCreate : undefined}
            onEdit={canManage ? editor.openEdit : undefined}
            onDelete={
              canManage ? (worker) => editor.requestDelete(worker, describe(worker)) : undefined
            }
          />
        )}
        {open?.mode === 'view' && (
          <div className="resource-details">
            <ContractorWorkerDetails
              worker={open.item}
              contractor={contractor}
              onEdit={canManage ? () => editor.openEdit(open.item) : undefined}
            />
            <footer className="entity-form__footer">
              <div className="entity-form__primary">
                <button type="button" className="button" onClick={editor.closeEditor}>
                  Back
                </button>
                {canManage && (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => editor.openEdit(open.item)}
                  >
                    <Pencil size={16} aria-hidden />
                    Edit worker
                  </button>
                )}
              </div>
            </footer>
          </div>
        )}
        {open && open.mode !== 'view' && (
          <ContractorEmployeeForm
            key={open.mode === 'edit' ? open.item.id : 'new'}
            contractorId={contractor.id}
            item={open.mode === 'edit' ? open.item : undefined}
            onSaved={(saved) => editor.handleSaved(describe(saved), open.mode === 'create')}
            onCancel={editor.closeEditor}
          />
        )}
      </Drawer>

      <ResourceDeleteDialog
        noun="worker"
        pendingDelete={editor.pendingDelete}
        itemName={workerName}
        deleting={editor.deleting}
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </>
  );
}
