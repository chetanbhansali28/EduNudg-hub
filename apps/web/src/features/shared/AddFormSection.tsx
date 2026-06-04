import { useState, type ReactNode } from "react";
import { Button, Card } from "@edunudg/ui";

export type AddFormSectionActions = {
  close: () => void;
};

type Props = {
  buttonLabel: string;
  panelTitle?: string;
  children: ReactNode | ((actions: AddFormSectionActions) => ReactNode);
};

export function AddFormSection({ buttonLabel, panelTitle, children }: Props) {
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

  return (
    <Card
      title={panelTitle ?? buttonLabel}
      actions={
        <Button variant="ghost" onClick={close}>
          Cancel
        </Button>
      }
    >
      {body}
    </Card>
  );
}
