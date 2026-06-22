import type { ReactNode } from "react";

export type AuditActionTone = "blue" | "purple" | "pink" | "red" | "grey";
export type AuditCategoryTone = "blue" | "purple" | "red" | "indigo";

export function AuditShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-audit", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function AuditPageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="ed-audit-header">
      <h1 className="ed-audit-header__title">{title}</h1>
      {subtitle ? <p className="ed-audit-header__subtitle">{subtitle}</p> : null}
    </header>
  );
}

export function AuditVisibility({ mobile, desktop }: { mobile: ReactNode; desktop: ReactNode }) {
  return (
    <>
      <div className="ed-audit-only-mobile">{mobile}</div>
      <div className="ed-audit-only-desktop">{desktop}</div>
    </>
  );
}

export function AuditSummaryGrid({ children }: { children: ReactNode }) {
  return <div className="ed-audit-summary-grid">{children}</div>;
}

export function AuditSummaryCard({
  label,
  value,
  hint,
  trend,
  trendTone = "up",
  statusDot,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: ReactNode;
  trendTone?: "up" | "down" | "steady";
  statusDot?: boolean;
}) {
  const trendClass =
    trendTone === "up"
      ? "ed-audit-summary__trend--up"
      : trendTone === "down"
        ? "ed-audit-summary__trend--down"
        : "ed-audit-summary__trend--steady";

  return (
    <article className="ed-audit-summary">
      <div className="ed-audit-summary__top">
        <p className="ed-audit-summary__label">{label}</p>
        {trend ? <span className={["ed-audit-summary__trend", trendClass].join(" ")}>{trend}</span> : null}
      </div>
      <p className="ed-audit-summary__value">
        {statusDot ? <span className="ed-audit-summary__dot" aria-hidden /> : null}
        {value}
      </p>
      {hint ? <p className="ed-audit-summary__hint">{hint}</p> : null}
    </article>
  );
}

export function AuditToolbar({ filters, actions }: { filters: ReactNode; actions?: ReactNode }) {
  return (
    <div className="ed-audit-toolbar">
      <div className="ed-audit-toolbar__filters">{filters}</div>
      {actions ? <div className="ed-audit-toolbar__actions">{actions}</div> : null}
    </div>
  );
}

export function AuditFilterSelect({
  label,
  value,
  onChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
}) {
  return (
    <label className="ed-audit-filter">
      {icon ? <span className="ed-audit-filter__icon">{icon}</span> : null}
      <span className="ed-audit-filter__label">{label}</span>
      <select className="ed-audit-filter__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AuditPrimaryButton({
  children,
  onClick,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button type="button" className="ed-audit-primary-btn" onClick={onClick}>
      {icon ? <span className="ed-audit-primary-btn__icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export function AuditDataTable({
  columns,
  rows,
  selectedKey,
  onSelect,
  emptyMessage = "No audit events yet.",
}: {
  columns: { key: string; label: string }[];
  rows: { key: string; cells: Record<string, ReactNode> }[];
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="ed-audit-table__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-audit-table-wrap">
      <table className="ed-audit-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={selectedKey === row.key ? "is-selected" : undefined}
              onClick={onSelect ? () => onSelect(row.key) : undefined}
            >
              {columns.map((column) => (
                <td key={column.key}>{row.cells[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuditTimestampCell({ date, time }: { date: string; time: string }) {
  return (
    <div className="ed-audit-timestamp">
      <span className="ed-audit-timestamp__date">{date}</span>
      <span className="ed-audit-timestamp__time">{time}</span>
    </div>
  );
}

export function AuditAdminCell({
  initials,
  name,
  tone = "blue",
}: {
  initials: string;
  name: string;
  tone?: AuditCategoryTone;
}) {
  return (
    <div className="ed-audit-admin">
      <span className={`ed-audit-admin__avatar ed-audit-admin__avatar--${tone}`}>{initials}</span>
      <span className="ed-audit-admin__name">{name}</span>
    </div>
  );
}

export function AuditActionBadge({ label, tone = "blue" }: { label: string; tone?: AuditActionTone }) {
  return <span className={`ed-audit-action ed-audit-action--${tone}`}>{label}</span>;
}

export function AuditPagination({
  summary,
  onPrevious,
  onNext,
  disablePrevious,
  disableNext,
}: {
  summary: string;
  onPrevious?: () => void;
  onNext?: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
}) {
  return (
    <div className="ed-audit-pagination">
      <p className="ed-audit-pagination__summary">{summary}</p>
      <div className="ed-audit-pagination__nav">
        <button type="button" className="ed-audit-pagination__btn" onClick={onPrevious} disabled={disablePrevious}>
          ‹
        </button>
        <button type="button" className="ed-audit-pagination__btn" onClick={onNext} disabled={disableNext}>
          ›
        </button>
      </div>
    </div>
  );
}

export function AuditDetailPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;

  return (
    <aside className="ed-audit-detail" aria-label="Entry metadata">
      <div className="ed-audit-detail__head">
        <div>
          <h2 className="ed-audit-detail__title">{title}</h2>
          {subtitle ? <p className="ed-audit-detail__subtitle">{subtitle}</p> : null}
        </div>
        <button type="button" className="ed-audit-detail__close" aria-label="Close" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="ed-audit-detail__body">{children}</div>
      {footer ? <div className="ed-audit-detail__footer">{footer}</div> : null}
    </aside>
  );
}

export function AuditDetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ed-audit-detail-section">
      <h3 className="ed-audit-detail-section__title">{title}</h3>
      {children}
    </section>
  );
}

export function AuditJsonBlock({ children }: { children: string }) {
  return <pre className="ed-audit-json">{children}</pre>;
}

export function AuditEntityTags({ tags }: { tags: string[] }) {
  return (
    <div className="ed-audit-entities">
      {tags.map((tag) => (
        <span key={tag} className="ed-audit-entities__tag">
          {tag}
        </span>
      ))}
    </div>
  );
}

export function AuditOutlineButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" className="ed-audit-outline-btn" onClick={onClick}>
      {children}
    </button>
  );
}

export function AuditMobileSearch({
  value,
  onChange,
  onFilterClick,
}: {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
}) {
  return (
    <div className="ed-audit-mobile-search">
      <label className="ed-audit-mobile-search__field">
        <span className="ed-audit-mobile-search__icon" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          className="ed-audit-mobile-search__input"
          placeholder="Search activities..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <button type="button" className="ed-audit-mobile-search__filter" onClick={onFilterClick}>
        <span aria-hidden>⏷</span> Filter
      </button>
    </div>
  );
}

export function AuditMobileGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="ed-audit-mobile-group">
      <h2 className="ed-audit-mobile-group__label">{label}</h2>
      <div className="ed-audit-mobile-group__card">{children}</div>
    </section>
  );
}

export function AuditMobileItem({
  icon,
  iconTone = "blue",
  category,
  time,
  title,
  meta,
  onClick,
}: {
  icon: ReactNode;
  iconTone?: AuditCategoryTone;
  category: string;
  time: string;
  title: string;
  meta: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button type="button" className="ed-audit-mobile-item" onClick={onClick}>
      <span className={`ed-audit-mobile-item__icon ed-audit-mobile-item__icon--${iconTone}`}>{icon}</span>
      <span className="ed-audit-mobile-item__main">
        <span className="ed-audit-mobile-item__row">
          <span className={`ed-audit-mobile-item__category ed-audit-mobile-item__category--${iconTone}`}>
            {category}
          </span>
          <span className="ed-audit-mobile-item__time">{time}</span>
        </span>
        <span className="ed-audit-mobile-item__title">{title}</span>
        <span className="ed-audit-mobile-item__meta">{meta}</span>
      </span>
      <span className="ed-audit-mobile-item__chevron" aria-hidden>
        ›
      </span>
    </button>
  );
}

export function AuditFab({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="ed-audit-fab" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function AuditLayoutWithDetail({
  main,
  detail,
}: {
  main: ReactNode;
  detail: ReactNode;
}) {
  return (
    <div className="ed-audit-layout">
      <div className="ed-audit-layout__main">{main}</div>
      {detail}
    </div>
  );
}
