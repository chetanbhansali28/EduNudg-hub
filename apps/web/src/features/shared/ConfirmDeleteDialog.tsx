import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Input } from "@edunudg/ui";
import { DEFAULT_DELETE_WARNING, DELETE_CONFIRM_PHRASE, isDeleteConfirmed } from "./confirmDelete";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmPending?: boolean;
};

export function ConfirmDeleteDialog({
  open,
  onClose,
  onConfirm,
  title = "Delete permanently?",
  description = DEFAULT_DELETE_WARNING,
  confirmPending = false,
}: Props) {
  const titleId = useId();
  const descId = useId();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) {
      setTyped("");
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const confirmed = isDeleteConfirmed(typed);

  return createPortal(
    <div className="ed-confirm-delete-backdrop" onClick={onClose}>
      <div
        className="ed-confirm-delete"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="ed-confirm-delete__title">
          {title}
        </h2>
        <p id={descId} className="ed-confirm-delete__description">
          {description}
        </p>
        <Input
          label={`Type ${DELETE_CONFIRM_PHRASE} to proceed`}
          value={typed}
          onChange={setTyped}
          placeholder={DELETE_CONFIRM_PHRASE}
          autoComplete="off"
        />
        <div className="ed-confirm-delete__actions">
          <Button variant="ghost" onClick={onClose} disabled={confirmPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={!confirmed || confirmPending}>
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
