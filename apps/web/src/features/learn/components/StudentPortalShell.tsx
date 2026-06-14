import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SectionCard({
  title,
  action,
  headerAside,
  children,
  className,
  id,
  panel = false,
}: {
  title?: string;
  action?: { label: string; to: string };
  headerAside?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  panel?: boolean;
}) {
  return (
    <section
      id={id}
      className={["ed-sp-section", panel ? "ed-sp-section--panel" : "", className].filter(Boolean).join(" ")}
    >
      {(title || action || headerAside) && (
        <div className="ed-sp-section__head">
          {title ? <h2 className="ed-sp-section__title">{title}</h2> : <span />}
          {headerAside}
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

export function StudentPageWelcome({
  name,
  subtitle,
  mobile = false,
}: {
  name: string;
  subtitle?: string;
  mobile?: boolean;
}) {
  const first = name.trim().split(/\s+/)[0] ?? name;
  return (
    <header className={`ed-sp-welcome${mobile ? " ed-sp-welcome--mobile" : ""}`}>
      <h1 className="ed-sp-welcome__title">
        Welcome back, {first}
        {mobile ? "" : "!"}
      </h1>
      {subtitle && !mobile ? <p className="ed-sp-welcome__subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function StudentPageHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="ed-sp-page-heading">
      <h1 className="ed-sp-page-heading__title">{title}</h1>
      {subtitle ? <p className="ed-sp-page-heading__subtitle">{subtitle}</p> : null}
    </header>
  );
}
