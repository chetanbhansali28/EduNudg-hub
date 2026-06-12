import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SectionCard({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: { label: string; to: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["ed-sp-section", className].filter(Boolean).join(" ")}>
      {(title || action) && (
        <div className="ed-sp-section__head">
          {title ? <h2 className="ed-sp-section__title">{title}</h2> : <span />}
          {action ? (
            <Link className="ed-sp-section__action" to={action.to}>
              {action.label}
            </Link>
          ) : null}
        </div>
      )}
      <div className="ed-sp-section__body">{children}</div>
    </section>
  );
}

export function StudentEmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="ed-sp-empty">
      <p className="ed-sp-empty__title">{title}</p>
      <p className="ed-sp-empty__text">{text}</p>
    </div>
  );
}

export function StudentPortalLoading({ label = "Loading your dashboard…" }: { label?: string }) {
  return <p className="ed-sp-loading">{label}</p>;
}
