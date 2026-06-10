import type { ReactNode } from "react";
import { PageToolbar, SaveButton, Toggle } from "@edunudg/ui";

type ShellProps = {
  title: string;
  subtitle?: ReactNode;
  /** Extra toolbar actions; when omitted, `onSave` renders a Save button in the toolbar. */
  actions?: ReactNode;
  onSave?: () => void;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
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
  saveLabel = "Save changes",
  children,
}: ShellProps) {
  const toolbarActions =
    actions ??
    (onSave ? (
      <SaveButton onClick={onSave} pending={savePending} saved={saved} label={saveLabel} />
    ) : undefined);

  return (
    <div className={["ed-homepage-editor-shell", onSave ? "ed-homepage-editor-shell--has-save" : ""].filter(Boolean).join(" ")}>
      <PageToolbar title={title} subtitle={subtitle}>
        {toolbarActions}
      </PageToolbar>
      {children}
      {onSave ? (
        <div className="ed-editor-save-bar" role="region" aria-label="Save changes">
          <SaveButton onClick={onSave} pending={savePending} saved={saved} label={saveLabel} block />
        </div>
      ) : null}
    </div>
  );
}

type PanelProps = {
  title: string;
  description?: ReactNode;
  onSave: () => void;
  savePending?: boolean;
  saved?: boolean;
  saveLabel?: string;
  children: ReactNode;
};

/** One editable site (brand or center template) inside the marketing pages editor. */
export function HomepageEditorPanel({
  title,
  description,
  onSave,
  savePending,
  saved,
  saveLabel = "Save changes",
  children,
}: PanelProps) {
  return (
    <section className="ed-homepage-editor-panel">
      <div className="ed-homepage-editor-panel__header">
        <div className="ed-homepage-editor-panel__intro">
          <h3 className="ed-homepage-editor-panel__title">{title}</h3>
          {description ? <div className="ed-homepage-editor-panel__desc">{description}</div> : null}
        </div>
        <SaveButton onClick={onSave} pending={savePending} saved={saved} label={saveLabel} />
      </div>
      {children}
    </section>
  );
}

type AccordionProps = {
  title: string;
  children: ReactNode;
  /** When set, shows a visibility toggle for this section on the public site. */
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

/** Collapsed-by-default section for long admin/marketing forms. */
export function EditorAccordion({ title, children, enabled = true, onEnabledChange }: AccordionProps) {
  const showToggle = onEnabledChange != null;

  return (
    <details
      className={[
        "ed-editor-accordion",
        showToggle && !enabled ? "ed-editor-accordion--section-off" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <summary className="ed-editor-accordion__summary">
        <span className="ed-editor-accordion__title">{title}</span>
      </summary>
      <div className="ed-editor-accordion__body">
        {showToggle ? (
          <div className="ed-editor-accordion__visibility">
            <label className="ed-editor-accordion__visibility-label">
              <Toggle
                checked={enabled}
                onChange={onEnabledChange}
                aria-label={`${title} visible on site`}
              />
              Visible on site
            </label>
          </div>
        ) : null}
        {children}
      </div>
    </details>
  );
}
