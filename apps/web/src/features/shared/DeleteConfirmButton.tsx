import { useState, type ReactNode } from "react";
import { Button } from "@edunudg/ui";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";

type Props = {
  onConfirm: () => void;
  description?: string;
  title?: string;
  disabled?: boolean;
  children?: ReactNode;
  confirmPending?: boolean;
};

/** Standalone delete button that requires typing CONFIRM before proceeding. */
export function DeleteConfirmButton({
  onConfirm,
  description,
  title,
  disabled,
  children = "Delete",
  confirmPending,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)} disabled={disabled}>
        {children}
      </Button>
      <ConfirmDeleteDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          onConfirm();
          setOpen(false);
        }}
        title={title}
        description={description}
        confirmPending={confirmPending}
      />
    </>
  );
}
