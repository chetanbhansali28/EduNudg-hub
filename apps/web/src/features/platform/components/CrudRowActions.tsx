import { Button } from "@edunudg/ui";

export function CrudRowActions({
  editing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  saveDisabled,
  saveLabel = "Save",
}: {
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  saveDisabled?: boolean;
  saveLabel?: string;
}) {
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
        <Button variant="danger" onClick={onDelete}>
          Delete
        </Button>
      )}
    </>
  );
}
