import type { ReactNode, MouseEvent } from "react";
import { Toggle } from "@edunudg/ui";

type Props = {
  title: string;
  children: ReactNode;
  /** When set, shows a visibility toggle for this section on the public site. */
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
};

/** Collapsed-by-default section for long admin/marketing forms. */
export function EditorAccordion({ title, children, enabled = true, onEnabledChange }: Props) {
  const showToggle = onEnabledChange != null;

  const stopToggleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

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
        {showToggle ? (
          <span className="ed-editor-accordion__toggle" onClick={stopToggleClick}>
            <Toggle
              checked={enabled}
              onChange={onEnabledChange}
              aria-label={`Show ${title} on public site`}
            />
          </span>
        ) : null}
      </summary>
      <div className="ed-editor-accordion__body">{children}</div>
    </details>
  );
}
