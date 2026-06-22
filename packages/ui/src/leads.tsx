import type { ReactNode } from "react";

export type LeadBadgeTone = "new" | "converted" | "center" | "brand" | "lost" | "attention" | "neutral";

export function LeadStatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: LeadBadgeTone;
}) {
  return <span className={`ed-lead-status ed-lead-status--${tone}`}>{children}</span>;
}

export function LeadAvatar({
  initials,
  tone = "blue",
}: {
  initials: string;
  tone?: "blue" | "purple" | "teal" | "amber" | "gray";
}) {
  return (
    <span className={`ed-lead-avatar ed-lead-avatar--${tone}`} aria-hidden>
      {initials}
    </span>
  );
}

export function LeadPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ed-lead-page-header">
      <div className="ed-lead-page-header__copy">
        <h1 className="ed-lead-page-header__title">{title}</h1>
        {subtitle ? <p className="ed-lead-page-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-lead-page-header__actions">{actions}</div> : null}
    </header>
  );
}

export function LeadKpiGrid({ children }: { children: ReactNode }) {
  return <div className="ed-lead-kpi-grid">{children}</div>;
}

export function LeadKpiCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  active,
  onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "urgent" | "lost" | "total";
  active?: boolean;
  onClick?: () => void;
}) {
  const className = [
    "ed-lead-kpi",
    `ed-lead-kpi--${tone}`,
    active ? "is-active" : "",
    onClick ? "is-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <div className="ed-lead-kpi__head">
        {icon ? <span className="ed-lead-kpi__icon">{icon}</span> : null}
        {hint ? <span className="ed-lead-kpi__hint">{hint}</span> : null}
      </div>
      <p className="ed-lead-kpi__label">{label}</p>
      <p className="ed-lead-kpi__value">{value}</p>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={active}>
        {content}
      </button>
    );
  }

  return <article className={className}>{content}</article>;
}

export function LeadFilterPills<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel = "Lead filter",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  "aria-label"?: string;
}) {
  return (
    <div className="ed-lead-filter-pills" role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value;
        const label = opt.count != null ? `${opt.label} (${opt.count})` : opt.label;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            className={`ed-lead-filter-pills__btn${active ? " is-active" : ""}`}
            onClick={() => onChange(opt.value)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function LeadListCard({
  initials,
  avatarTone = "blue",
  title,
  meta,
  lines,
  when,
  badges,
  selected,
  footer,
  onSelect,
}: {
  initials: string;
  avatarTone?: "blue" | "purple" | "teal" | "amber" | "gray";
  title: string;
  meta?: ReactNode;
  lines?: { label: string; value: ReactNode }[];
  when?: string;
  badges?: ReactNode;
  selected?: boolean;
  footer?: ReactNode;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <div className="ed-lead-list-card__head">
        <LeadAvatar initials={initials} tone={avatarTone} />
        <div className="ed-lead-list-card__copy">
          <p className="ed-lead-list-card__title">{title}</p>
          {meta ? <p className="ed-lead-list-card__meta">{meta}</p> : null}
        </div>
        {when ? <span className="ed-lead-list-card__when">{when}</span> : null}
      </div>
      {lines && lines.length > 0 ? (
        <div className="ed-lead-list-card__lines">
          {lines.map((line) => (
            <p key={`${line.label}-${line.value}`} className="ed-lead-list-card__line">
              <span>{line.label}: </span>
              <strong>{line.value}</strong>
            </p>
          ))}
        </div>
      ) : null}
      {badges ? <div className="ed-lead-list-card__badges">{badges}</div> : null}
      {footer ? <div className="ed-lead-list-card__footer">{footer}</div> : null}
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={`ed-lead-list-card${selected ? " is-selected" : ""}`}
        onClick={onSelect}
        aria-pressed={selected}
      >
        {body}
      </button>
    );
  }

  return <article className={`ed-lead-list-card${selected ? " is-selected" : ""}`}>{body}</article>;
}

export function LeadInsightsCard({
  title = "Follow-up Insights",
  body,
  metricLabel,
  metricValue,
  benchmark,
  action,
}: {
  title?: string;
  body: string;
  metricLabel: string;
  metricValue: string;
  benchmark?: string;
  action?: ReactNode;
}) {
  return (
    <aside className="ed-lead-insights-card">
      <div className="ed-lead-insights-card__head">
        <h2 className="ed-lead-insights-card__title">{title}</h2>
      </div>
      <p className="ed-lead-insights-card__body">{body}</p>
      <div className="ed-lead-insights-card__metric">
        <span>{metricLabel}</span>
        <strong>{metricValue}</strong>
      </div>
      {benchmark ? <p className="ed-lead-insights-card__benchmark">{benchmark}</p> : null}
      {action ? <div className="ed-lead-insights-card__action">{action}</div> : null}
    </aside>
  );
}

export function LeadInsightBanner({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <aside className="ed-lead-insight-banner">
      <div className="ed-lead-insight-banner__head">
        <h2 className="ed-lead-insight-banner__title">{title}</h2>
      </div>
      <p className="ed-lead-insight-banner__body">{body}</p>
      {onAction ? (
        <button type="button" className="ed-lead-insight-banner__btn" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </aside>
  );
}

export function LeadTasksCard({
  title = "Tasks for Today",
  total,
  items,
  action,
}: {
  title?: string;
  total: number;
  items: { key: string; icon?: ReactNode; label: string; time: string }[];
  action?: ReactNode;
}) {
  return (
    <section className="ed-lead-tasks-card">
      <div className="ed-lead-tasks-card__head">
        <h2 className="ed-lead-tasks-card__title">{title}</h2>
        <span className="ed-lead-tasks-card__badge">{total} TOTAL</span>
      </div>
      <ul className="ed-lead-tasks-card__list">
        {items.map((item) => (
          <li key={item.key} className="ed-lead-tasks-card__item">
            {item.icon ? <span className="ed-lead-tasks-card__icon">{item.icon}</span> : null}
            <span className="ed-lead-tasks-card__label">{item.label}</span>
            <span className="ed-lead-tasks-card__time">{item.time}</span>
          </li>
        ))}
      </ul>
      {action ? <div className="ed-lead-tasks-card__action">{action}</div> : null}
    </section>
  );
}

export function LeadFab({ onClick, label = "Add lead" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ed-lead-fab" onClick={onClick} aria-label={label}>
      +
    </button>
  );
}

export function LeadDetailHeader({
  title,
  status,
  submittedAt,
  onBack,
}: {
  title: string;
  status?: ReactNode;
  submittedAt?: string;
  onBack?: () => void;
}) {
  return (
    <header className="ed-lead-detail-header">
      {onBack ? (
        <button type="button" className="ed-lead-detail-header__back" onClick={onBack} aria-label="Back">
          ‹
        </button>
      ) : null}
      <div className="ed-lead-detail-header__copy">
        <div className="ed-lead-detail-header__title-row">
          <h1 className="ed-lead-detail-header__title">{title}</h1>
          {status}
        </div>
        {submittedAt ? <p className="ed-lead-detail-header__submitted">{submittedAt}</p> : null}
      </div>
    </header>
  );
}

export function LeadApplicantCard({
  title = "Applicant Information",
  badge,
  fields,
  footer,
}: {
  title?: string;
  badge?: ReactNode;
  fields: { key: string; label: string; value: ReactNode }[];
  footer?: ReactNode;
}) {
  return (
    <section className="ed-lead-applicant-card">
      <div className="ed-lead-applicant-card__head">
        <h2 className="ed-lead-applicant-card__title">{title}</h2>
        {badge}
      </div>
      <dl className="ed-lead-applicant-card__grid">
        {fields.map((field) => (
          <div key={field.key} className="ed-lead-applicant-card__field">
            <dt>{field.label}</dt>
            <dd>{field.value}</dd>
          </div>
        ))}
      </dl>
      {footer ? <div className="ed-lead-applicant-card__footer">{footer}</div> : null}
    </section>
  );
}

export function LeadSuggestionCard({
  title,
  subtitle,
  pincode,
  tag,
  tone = "primary",
  selected,
  onSelect,
}: {
  title: string;
  subtitle?: string;
  pincode?: string;
  tag?: string;
  tone?: "primary" | "secondary";
  selected?: boolean;
  onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      className={`ed-lead-suggestion-card ed-lead-suggestion-card--${tone}${selected ? " is-selected" : ""}`}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <div className="ed-lead-suggestion-card__copy">
        <p className="ed-lead-suggestion-card__title">{title}</p>
        {subtitle ? <p className="ed-lead-suggestion-card__subtitle">{subtitle}</p> : null}
      </div>
      <div className="ed-lead-suggestion-card__meta">
        {pincode ? <strong>{pincode}</strong> : null}
        {tag ? <span>{tag}</span> : null}
      </div>
    </button>
  );
}

export function LeadAssignmentPanel({
  title = "Assignment Management",
  pincode,
  suggestions,
  manualSelect,
  footer,
}: {
  title?: string;
  pincode?: string;
  suggestions: ReactNode;
  manualSelect: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ed-lead-assignment-panel">
      <div className="ed-lead-assignment-panel__head">
        <h2 className="ed-lead-assignment-panel__title">{title}</h2>
        {pincode ? <span className="ed-lead-assignment-panel__pincode">Pincode: {pincode}</span> : null}
      </div>
      <div className="ed-lead-assignment-panel__suggestions">{suggestions}</div>
      <div className="ed-lead-assignment-panel__manual">{manualSelect}</div>
      {footer ? <div className="ed-lead-assignment-panel__footer">{footer}</div> : null}
    </section>
  );
}

export function LeadToolbarRow({
  tabs,
  sort,
}: {
  tabs: ReactNode;
  sort?: ReactNode;
}) {
  return (
    <div className="ed-lead-toolbar-row">
      <div className="ed-lead-toolbar-row__tabs">{tabs}</div>
      {sort ? <div className="ed-lead-toolbar-row__sort">{sort}</div> : null}
    </div>
  );
}

export function LeadGridCard({
  initials,
  avatarTone = "blue",
  title,
  when,
  statusBadge,
  sourceBadge,
  fields,
  footer,
  onSelect,
}: {
  initials: string;
  avatarTone?: "blue" | "purple" | "teal" | "amber" | "gray";
  title: string;
  when?: string;
  statusBadge?: ReactNode;
  sourceBadge?: ReactNode;
  fields: { label: string; value: ReactNode }[];
  footer?: ReactNode;
  onSelect?: () => void;
}) {
  const content = (
    <>
      <div className="ed-lead-grid-card__head">
        <LeadAvatar initials={initials} tone={avatarTone} />
        <div className="ed-lead-grid-card__copy">
          <p className="ed-lead-grid-card__title">{title}</p>
          {when ? <p className="ed-lead-grid-card__when">{when}</p> : null}
        </div>
        <div className="ed-lead-grid-card__badges">
          {statusBadge}
          {sourceBadge}
        </div>
      </div>
      <div className="ed-lead-grid-card__fields">
        {fields.map((field) => (
          <div key={field.label} className="ed-lead-grid-card__field">
            <span>{field.label}</span>
            <strong>{field.value}</strong>
          </div>
        ))}
      </div>
      {footer ? <div className="ed-lead-grid-card__footer">{footer}</div> : null}
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className="ed-lead-grid-card" onClick={onSelect}>
        {content}
      </button>
    );
  }

  return <article className="ed-lead-grid-card">{content}</article>;
}
