import { useState, type ReactNode } from "react";
import { Button, Card, FormActions, SaveButton } from "@edunudg/ui";

export type AddFormSectionActions = {
  close: () => void;
};

export type AddFormPrimaryAction = {
  label?: string;
  onClick: () => void;
  pending?: boolean;
  disabled?: boolean;
  saved?: boolean;
};

type Props = {
  buttonLabel: string;
  panelTitle?: string;
  /** When set, renders next to Cancel (header by default, or footer when actionsPlacement is footer). */
  primaryAction?: AddFormPrimaryAction;
  /** header = actions in card header; footer = actions after form fields (better tab flow). */
  actionsPlacement?: "header" | "footer";
  /** Controlled open state — use with onOpenChange to open the panel from outside (e.g. Edit). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** When true with controlled open, hides the default trigger button when closed. */
  hideTrigger?: boolean;
  children: ReactNode | ((actions: AddFormSectionActions) => ReactNode);
};

export function AddFormSection({
  buttonLabel,
  panelTitle,
  primaryAction,
  actionsPlacement = "header",
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  children,
}: Props) {
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;

  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenInternal(next);
    onOpenChange?.(next);
  };

  const close = () => setOpen(false);

  if (!open) {
    if (hideTrigger) return null;
    return (
      <div className="ed-add-form-trigger">
        <Button onClick={() => setOpen(true)}>{buttonLabel}</Button>
      </div>
    );
  }

  const body = typeof children === "function" ? children({ close }) : children;
  const submitLabel = primaryAction?.label ?? "Save";

  const actionButtons = (
    <>
      <Button variant="ghost" onClick={close}>
        Cancel
      </Button>
      {primaryAction ? (
        <SaveButton
          onClick={primaryAction.onClick}
          pending={primaryAction.pending}
          disabled={primaryAction.disabled}
          saved={primaryAction.saved}
          label={submitLabel}
        />
      ) : null}
    </>
  );

  return (
    <Card
      title={panelTitle ?? buttonLabel}
      actions={
        actionsPlacement === "header"
          ? primaryAction
            ? actionButtons
            : (
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
              )
          : undefined
      }
    >
      {body}
      {actionsPlacement === "footer" && primaryAction ? <FormActions>{actionButtons}</FormActions> : null}
    </Card>
  );
}
