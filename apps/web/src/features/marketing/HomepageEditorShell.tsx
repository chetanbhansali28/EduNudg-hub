import type { ReactNode } from "react";
import { Button, PageToolbar } from "@edunudg/ui";

type ShellProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

/** Shared layout wrapper for platform and brand homepage editors. */
export function HomepageEditorShell({ title, subtitle, actions, children }: ShellProps) {
  return (
    <div className="ed-homepage-editor-shell">
      <PageToolbar title={title} subtitle={subtitle}>
        {actions}
      </PageToolbar>
      {children}
    </div>
  );
}

type PanelProps = {
  title: string;
  description?: ReactNode;
  saveLabel: string;
  onSave: () => void;
  savePending?: boolean;
  saved?: boolean;
  children: ReactNode;
};

/** One editable site (brand or center template) inside the marketing pages editor. */
export function HomepageEditorPanel({
  title,
  description,
  saveLabel,
  onSave,
  savePending,
  saved,
  children,
}: PanelProps) {
  return (
    <section className="ed-homepage-editor-panel">
      <div className="ed-homepage-editor-panel__header">
        <div className="ed-homepage-editor-panel__intro">
          <h3 className="ed-homepage-editor-panel__title">{title}</h3>
          {description ? <div className="ed-homepage-editor-panel__desc">{description}</div> : null}
        </div>
        <Button onClick={onSave} disabled={savePending}>
          {savePending ? "Saving…" : saved ? "Saved" : saveLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}
