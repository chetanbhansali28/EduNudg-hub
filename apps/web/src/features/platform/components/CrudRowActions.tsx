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
  saveLabel?: string;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (editing) {
    return (
      <>
        <SaveButton onClick={onSave} disabled={saveDisabled} label={saveLabel} />
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
