import { useState } from "react";
import { Button } from "@edunudg/ui";
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
        <Button onClick={onSave} disabled={saveDisabled}>
          {saveLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </>
    );
  }

  return (
    <>
      <Button variant="ghost" onClick={onEdit}>
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
