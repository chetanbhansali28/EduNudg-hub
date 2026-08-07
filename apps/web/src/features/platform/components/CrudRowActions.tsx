import { useState } from "react";
import { Button, SaveButton } from "@edunudg/ui";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";

export function CrudRowActions({
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  deleteDescription,
  deleteTitle,
  saveDisabled,
  savePending,
  saveSaved,
  saveLabel = "Save",
}: {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  deleteDescription?: string;
  deleteTitle?: string;
  saveDisabled?: boolean;
  savePending?: boolean;
  saveSaved?: boolean;
  saveLabel?: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (editing) {
    return (
      <>
        <SaveButton
          onClick={onSave}
          disabled={saveDisabled}
          pending={savePending}
          saved={saveSaved}
          label={saveLabel}
        />
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </>
    );
  }

  return (
    <>
      <Button variant="primary" onClick={onEdit}>
        Edit
      </Button>
      {onDelete && (
        <>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
          <ConfirmDeleteDialog
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            onConfirm={() => {
              onDelete();
              setDeleteOpen(false);
            }}
            title={deleteTitle}
            description={deleteDescription}
          />
        </>
      )}
    </>
  );
}
