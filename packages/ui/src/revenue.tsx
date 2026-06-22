import type { ReactNode } from "react";

export type RevenueIconTone = "blue" | "purple" | "red" | "green";
export type RevenueInvoiceStatusTone = "paid" | "pending" | "overdue" | "neutral";
export type RevenueBrandTone = "blue" | "purple" | "pink";

export function RevenueShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-rev", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function RevenuePageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="ed-rev-header">
      <div className="ed-rev-header__copy">
        <h1 className="ed-rev-header__title">{title}</h1>
        {subtitle ? <p className="ed-rev-header__subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="ed-rev-header__actions">{actions}</div> : null}
    </header>
  );
}

export function RevenueVisibility({
  mobile,
  desktop,
}: {
  mobile: ReactNode;
  desktop: ReactNode;
}) {
  return (
    <>
      <div className="ed-rev-only-mobile">{mobile}</div>
      <div className="ed-rev-only-desktop">{desktop}</div>
    </>
  );
}

export function RevenueStatGrid({ children }: { children: ReactNode }) {
  return <div className="ed-rev-stat-grid">{children}</div>;
}

export function RevenueStatCarousel({ children }: { children: ReactNode }) {
  return <div className="ed-rev-stat-carousel">{children}</div>;
}

export function RevenueStatCard({
  label,
  value,
  hint,
  trend,
  trendTone = "up",
  icon,
  iconTone = "blue",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: ReactNode;
  trendTone?: "up" | "down" | "steady";
  icon: ReactNode;
  iconTone?: RevenueIconTone;
}) {
  const trendClass =
    trendTone === "up"
      ? "ed-rev-stat__trend--up"
      : trendTone === "down"
        ? "ed-rev-stat__trend--down"
        : "ed-rev-stat__trend--steady";

  return (
    <article className="ed-rev-stat">
      <span className={`ed-rev-stat__icon ed-rev-stat__icon--${iconTone}`} aria-hidden>
        {icon}
      </span>
      <p className="ed-rev-stat__label">{label}</p>
      <p className="ed-rev-stat__value">{value}</p>
      {trend ? <p className={["ed-rev-stat__trend", trendClass].join(" ")}>{trend}</p> : null}
      {hint ? <p className="ed-rev-stat__hint">{hint}</p> : null}
    </article>
  );
}

export function RevenuePrimaryButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button type="button" className="ed-rev-primary-btn" onClick={onClick} disabled={disabled}>
      {icon ? <span className="ed-rev-primary-btn__icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export function RevenueSecondaryButton({
  children,
  onClick,
  disabled,
  icon,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button type="button" className="ed-rev-secondary-btn" onClick={onClick} disabled={disabled}>
      {icon ? <span className="ed-rev-secondary-btn__icon">{icon}</span> : null}
      {children}
    </button>
  );
}

export function RevenueIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" className="ed-rev-icon-btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

export function RevenueActionRow({ children }: { children: ReactNode }) {
  return <div className="ed-rev-action-row">{children}</div>;
}

export function RevenueNetworkCard({
  title,
  badge,
  stats,
  progressLabel,
  progressValue,
  progressPercent,
}: {
  title: string;
  badge?: ReactNode;
  stats: { label: string; value: ReactNode }[];
  progressLabel: string;
  progressValue: ReactNode;
  progressPercent: number;
}) {
  return (
    <section className="ed-rev-network">
      <div className="ed-rev-network__head">
        <h2 className="ed-rev-network__title">{title}</h2>
        {badge}
      </div>
      <div className="ed-rev-network__stats">
        {stats.map((stat) => (
          <div key={stat.label} className="ed-rev-network__stat">
            <p className="ed-rev-network__stat-value">{stat.value}</p>
            <p className="ed-rev-network__stat-label">{stat.label}</p>
          </div>
        ))}
      </div>
      <RevenueProgressGoal label={progressLabel} value={progressValue} percent={progressPercent} />
    </section>
  );
}

export function RevenueSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="ed-rev-section-header">
      <h2 className="ed-rev-section-header__title">{title}</h2>
      {actionLabel && onAction ? (
        <button type="button" className="ed-rev-section-header__link" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function RevenueSplit({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="ed-rev-split">
      <div className="ed-rev-split__main">{main}</div>
      <aside className="ed-rev-split__aside">{aside}</aside>
    </div>
  );
}

export function RevenuePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={["ed-rev-panel", className].filter(Boolean).join(" ")}>{children}</section>;
}

export function RevenueInvoiceStatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: RevenueInvoiceStatusTone;
}) {
  return <span className={`ed-rev-invoice-badge ed-rev-invoice-badge--${tone}`}>{label}</span>;
}

export function RevenueBrandMark({
  initials,
  tone = "blue",
}: {
  initials: string;
  tone?: RevenueBrandTone;
}) {
  return <span className={`ed-rev-brand-mark ed-rev-brand-mark--${tone}`}>{initials}</span>;
}

export function RevenueInvoiceTable({
  columns,
  rows,
  emptyMessage = "No invoices yet.",
}: {
  columns: { key: string; label: string; align?: "right" }[];
  rows: { key: string; cells: Record<string, ReactNode> }[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="ed-rev-invoice-table__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-rev-invoice-table-wrap">
      <table className="ed-rev-invoice-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === "right" ? "ed-rev-invoice-table__align-right" : undefined}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={column.align === "right" ? "ed-rev-invoice-table__align-right" : undefined}
                >
                  {row.cells[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RevenueInvoiceBrandCell({
  initials,
  tone,
  name,
}: {
  initials: string;
  tone?: RevenueBrandTone;
  name: string;
}) {
  return (
    <div className="ed-rev-invoice-brand">
      <RevenueBrandMark initials={initials} tone={tone} />
      <span className="ed-rev-invoice-brand__name">{name}</span>
    </div>
  );
}

export function RevenueInvoiceMobileItem({
  initials,
  tone,
  brandName,
  invoiceId,
  amount,
  status,
  menu,
}: {
  initials: string;
  tone?: RevenueBrandTone;
  brandName: string;
  invoiceId: string;
  amount: string;
  status: ReactNode;
  menu?: ReactNode;
}) {
  return (
    <article className="ed-rev-invoice-mobile">
      <div className="ed-rev-invoice-mobile__main">
        <RevenueBrandMark initials={initials} tone={tone} />
        <div>
          <p className="ed-rev-invoice-mobile__brand">{brandName}</p>
          <p className="ed-rev-invoice-mobile__id">{invoiceId}</p>
        </div>
      </div>
      <div className="ed-rev-invoice-mobile__aside">
        <p className="ed-rev-invoice-mobile__amount">{amount}</p>
        {status}
        {menu}
      </div>
    </article>
  );
}

export function RevenueMetricsPanel({
  title,
  periodLabel,
  onAddMetric,
  children,
  footer,
}: {
  title: string;
  periodLabel?: string;
  onAddMetric?: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="ed-rev-metrics">
      <div className="ed-rev-metrics__head">
        <h2 className="ed-rev-metrics__title">{title}</h2>
        {periodLabel ? <span className="ed-rev-metrics__period">{periodLabel}</span> : null}
      </div>
      {onAddMetric ? (
        <button type="button" className="ed-rev-metrics__add" onClick={onAddMetric}>
          <span aria-hidden>+</span> Add Metric
        </button>
      ) : null}
      <div className="ed-rev-metrics__list">{children}</div>
      {footer ? <div className="ed-rev-metrics__footer">{footer}</div> : null}
    </section>
  );
}

export function RevenueMetricItem({
  icon,
  iconTone = "blue",
  title,
  description,
  value,
  valueTone = "blue",
}: {
  icon: ReactNode;
  iconTone?: RevenueIconTone;
  title: string;
  description?: string;
  value: ReactNode;
  valueTone?: RevenueIconTone;
}) {
  return (
    <div className="ed-rev-metric-item">
      <span className={`ed-rev-metric-item__icon ed-rev-metric-item__icon--${iconTone}`} aria-hidden>
        {icon}
      </span>
      <div className="ed-rev-metric-item__copy">
        <p className="ed-rev-metric-item__title">{title}</p>
        {description ? <p className="ed-rev-metric-item__description">{description}</p> : null}
      </div>
      <p className={`ed-rev-metric-item__value ed-rev-metric-item__value--${valueTone}`}>{value}</p>
    </div>
  );
}

export function RevenueProgressGoal({
  label,
  value,
  percent,
}: {
  label: string;
  value: ReactNode;
  percent: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="ed-rev-progress">
      <div className="ed-rev-progress__head">
        <span className="ed-rev-progress__label">{label}</span>
        <span className="ed-rev-progress__value">{value}</span>
      </div>
      <div className="ed-rev-progress__track" aria-hidden>
        <span className="ed-rev-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export function RevenueLiveBadge({ children = "Live Now" }: { children?: ReactNode }) {
  return <span className="ed-rev-live-badge">{children}</span>;
}

export function RevenueInsightBanner({
  title = "Platform Insight",
  children,
  primaryAction,
  onPrimaryAction,
  onDismiss,
}: {
  title?: string;
  children: ReactNode;
  primaryAction?: string;
  onPrimaryAction?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <section className="ed-rev-insight">
      <div className="ed-rev-insight__copy">
        <span className="ed-rev-insight__badge">
          <span aria-hidden>★</span> {title}
        </span>
        <p className="ed-rev-insight__text">{children}</p>
      </div>
      <div className="ed-rev-insight__actions">
        {primaryAction && onPrimaryAction ? (
          <button type="button" className="ed-rev-insight__primary" onClick={onPrimaryAction}>
            {primaryAction}
          </button>
        ) : null}
        {onDismiss ? (
          <button type="button" className="ed-rev-insight__dismiss" onClick={onDismiss}>
            Dismiss
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function RevenueTableActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="ed-rev-table-actions">
      <button type="button" className="ed-rev-table-actions__btn" aria-label="Edit" onClick={onEdit}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        type="button"
        className="ed-rev-table-actions__btn ed-rev-table-actions__btn--danger"
        aria-label="Delete"
        onClick={onDelete}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        </svg>
      </button>
    </div>
  );
}
