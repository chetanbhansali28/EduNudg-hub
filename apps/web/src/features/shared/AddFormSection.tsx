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
  children: ReactNode | ((actions: AddFormSectionActions) => ReactNode);
};

export function AddFormSection({
  buttonLabel,
  panelTitle,
  primaryAction,
  actionsPlacement = "header",
  children,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  if (!open) {
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
