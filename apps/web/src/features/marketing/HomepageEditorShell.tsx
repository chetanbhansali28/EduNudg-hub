import type { ReactNode } from "react";
import { PageToolbar, SaveButton } from "@edunudg/ui";

type ShellProps = {
  title: string;
  subtitle?: ReactNode;
  /** Extra toolbar actions; when omitted, `onSave` renders a Save button in the toolbar. */
  actions?: ReactNode;
  onSave?: () => void;
  savePending?: boolean;
  saved?: boolean;
  children: ReactNode;
};

/** Shared layout wrapper for platform and brand homepage editors. */
export function HomepageEditorShell({
  title,
  subtitle,
  actions,
  onSave,
  savePending,
  saved,
  children,
}: ShellProps) {
  const toolbarActions =
    actions ??
    (onSave ? <SaveButton onClick={onSave} pending={savePending} saved={saved} /> : undefined);

  return (
    <div className="ed-homepage-editor-shell">
      <PageToolbar title={title} subtitle={subtitle}>
        {toolbarActions}
      </PageToolbar>
      {children}
    </div>
  );
}

type PanelProps = {
  title: string;
  description?: ReactNode;
  onSave: () => void;
  savePending?: boolean;
  saved?: boolean;
  children: ReactNode;
};

/** One editable site (brand or center template) inside the marketing pages editor. */
export function HomepageEditorPanel({
  title,
  description,
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
        <SaveButton onClick={onSave} pending={savePending} saved={saved} />
      </div>
      {children}
    </section>
  );
}
