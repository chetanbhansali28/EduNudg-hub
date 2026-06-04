import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

/** Collapsed-by-default section for long admin/marketing forms. */
export function EditorAccordion({ title, children }: Props) {
  return (
    <details className="ed-editor-accordion">
      <summary className="ed-editor-accordion__summary">{title}</summary>
      <div className="ed-editor-accordion__body">{children}</div>
    </details>
  );
}
