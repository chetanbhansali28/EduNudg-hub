import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type DashboardMetricTone = "blue" | "purple" | "magenta" | "green";

export function DashboardShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-dash", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function DashboardHero({
  greeting,
  title,
  subtitle,
  action,
}: {
  greeting?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="ed-dash-hero">
      <div className="ed-dash-hero__copy">
        {greeting ? <p className="ed-dash-hero__greeting">{greeting}</p> : null}
        {title ? <h1 className="ed-dash-hero__title">{title}</h1> : null}
        {subtitle ? <p className="ed-dash-hero__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="ed-dash-hero__action">{action}</div> : null}
    </header>
  );
}

export function DashboardSectionHeader({
  title,
  action,
  actionLabel,
  actionHref,
  onAction,
  className,
}: {
  title: string;
  action?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}) {
  const link =
    action ??
    (actionLabel && actionHref ? (
      <Link to={actionHref} className="ed-dash-section-header__link">
        {actionLabel}
      </Link>
    ) : actionLabel && onAction ? (
      <button type="button" className="ed-dash-section-header__link" onClick={onAction}>
        {actionLabel}
      </button>
    ) : null);

  return (
    <div className={["ed-dash-section-header", className].filter(Boolean).join(" ")}>
      <h2 className="ed-dash-section-header__title">{title}</h2>
      {link}
    </div>
  );
}

export function DashboardMetricGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={["ed-dash-metric-grid", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function DashboardMetricCard({
  label,
  value,
  hint,
  hintDesktop,
  hintHref,
  icon,
  iconTone = "blue",
  trend,
  trendTone = "up",
  href,
  onClick,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  hintDesktop?: ReactNode;
  hintHref?: string;
  icon: ReactNode;
  iconTone?: DashboardMetricTone;
  trend?: string;
  trendTone?: "up" | "down" | "steady";
  href?: string;
  onClick?: () => void;
  className?: string;
}) {
  const trendClass =
    trendTone === "up"
      ? "ed-dash-metric__trend--up"
      : trendTone === "down"
        ? "ed-dash-metric__trend--down"
        : "ed-dash-metric__trend--steady";

  const body = (
    <>
      <div className="ed-dash-metric__main">
        <p className="ed-dash-metric__label">{label}</p>
        <p className="ed-dash-metric__value">{value}</p>
        {hint || hintDesktop ? (
          hintHref ? (
            <Link to={hintHref} className="ed-dash-metric__hint ed-dash-metric__hint--link">
              {hint}
            </Link>
          ) : (
            <p className="ed-dash-metric__hint">
              {hint ? <span className="ed-dash-metric__hint-mobile">{hint}</span> : null}
              {hintDesktop ? <span className="ed-dash-metric__hint-desktop">{hintDesktop}</span> : null}
            </p>
          )
        ) : null}
      </div>
      <div className="ed-dash-metric__aside">
        {trend ? <span className={["ed-dash-metric__trend", trendClass].join(" ")}>{trend}</span> : null}
        <span className={`ed-dash-metric__icon ed-dash-metric__icon--${iconTone}`} aria-hidden>
          {icon}
        </span>
      </div>
    </>
  );

  const classNames = ["ed-dash-metric", className].filter(Boolean).join(" ");

  if (href) {
    return (
      <Link to={href} className={classNames}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={classNames} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <article className={classNames}>{body}</article>;
}

export type DashboardQuickActionTone = "primary" | "accent" | "muted";

export function DashboardQuickActionGrid({ children }: { children: ReactNode }) {
  return <div className="ed-dash-quick-grid">{children}</div>;
}

export function DashboardQuickAction({
  label,
  icon,
  tone = "muted",
  href,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  tone?: DashboardQuickActionTone;
  href?: string;
  onClick?: () => void;
}) {
  const className = `ed-dash-quick-action ed-dash-quick-action--${tone}`;
  const content = (
    <>
      <span className="ed-dash-quick-action__icon" aria-hidden>
        {icon}
      </span>
      <span className="ed-dash-quick-action__label">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export function DashboardSplit({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="ed-dash-split">
      <div className="ed-dash-split__main">{main}</div>
      <aside className="ed-dash-split__aside">{aside}</aside>
    </div>
  );
}

export function DashboardPanel({
  title,
  subtitle,
  badge,
  statusDot,
  actions,
  children,
  className,
  footer,
}: {
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  statusDot?: "success" | "warning" | "neutral";
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) {
  const hasHead = Boolean(title || subtitle || actions || statusDot);

  return (
    <section
      className={["ed-dash-panel", hasHead ? "" : "ed-dash-panel--headless", className].filter(Boolean).join(" ")}
    >
      {hasHead ? (
        <div className="ed-dash-panel__head">
          <div className="ed-dash-panel__head-copy">
            <div className="ed-dash-panel__title-row">
              {statusDot ? (
                <span className={`ed-dash-panel__status ed-dash-panel__status--${statusDot}`} aria-hidden />
              ) : null}
              {title ? <h2 className="ed-dash-panel__title">{title}</h2> : null}
              {badge}
            </div>
            {subtitle ? <p className="ed-dash-panel__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ed-dash-panel__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className="ed-dash-panel__body">{children}</div>
      {footer ? <div className="ed-dash-panel__footer">{footer}</div> : null}
    </section>
  );
}

export function DashboardSegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  "aria-label": ariaLabel = "Period",
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  "aria-label"?: string;
}) {
  return (
    <div className="ed-dash-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`ed-dash-segmented__btn${value === option.value ? " is-active" : ""}`}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export type DashboardLinePoint = {
  key: string;
  label: string;
  value: number;
};

export function DashboardLineChart({
  points,
  peakIndex,
  peakLabel,
  peakCaption,
  emptyMessage = "No enrollment data yet.",
}: {
  points: DashboardLinePoint[];
  peakIndex?: number;
  peakLabel?: string;
  peakCaption?: string;
  emptyMessage?: string;
}) {
  const labelId = useId();
  const max = Math.max(...points.map((point) => point.value), 1);
  const hasData = points.some((point) => point.value > 0);
  const width = 640;
  const height = 220;
  const padding = { top: 24, right: 24, bottom: 28, left: 8 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  if (!hasData) {
    return <p className="ed-dash-line-chart__empty">{emptyMessage}</p>;
  }

  const coords = points.map((point, index) => {
    const x =
      points.length === 1
        ? padding.left + innerWidth / 2
        : padding.left + (index / (points.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - (point.value / max) * innerHeight;
    return { ...point, x, y };
  });

  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = `${path} L${coords[coords.length - 1]?.x ?? 0},${padding.top + innerHeight} L${coords[0]?.x ?? 0},${padding.top + innerHeight} Z`;
  const highlightIndex = peakIndex ?? coords.reduce((best, point, index) => (point.value >= coords[best].value ? index : best), 0);
  const highlight = coords[highlightIndex];

  return (
    <div className="ed-dash-line-chart" aria-labelledby={labelId}>
      <svg
        className="ed-dash-line-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Enrollment growth line chart"
      >
        <defs>
          <linearGradient id="ed-dash-line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ed-primary)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--ed-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={padding.left}
            x2={width - padding.right}
            y1={padding.top + innerHeight * ratio}
            y2={padding.top + innerHeight * ratio}
            className="ed-dash-line-chart__grid"
          />
        ))}
        <path d={areaPath} className="ed-dash-line-chart__area" fill="url(#ed-dash-line-fill)" />
        <path d={path} className="ed-dash-line-chart__line" />
        {coords.map((point) => (
          <circle key={point.key} cx={point.x} cy={point.y} r="4" className="ed-dash-line-chart__dot" />
        ))}
        {highlight ? <circle cx={highlight.x} cy={highlight.y} r="7" className="ed-dash-line-chart__dot ed-dash-line-chart__dot--peak" /> : null}
      </svg>
      {highlight && peakLabel ? (
        <div
          className="ed-dash-line-chart__peak"
          style={{
            left: `${((highlight.x - padding.left) / innerWidth) * 100}%`,
            top: `${((highlight.y - padding.top) / innerHeight) * 100}%`,
          }}
        >
          <p className="ed-dash-line-chart__peak-label">Current peak</p>
          <p className="ed-dash-line-chart__peak-value">{peakLabel}</p>
          {peakCaption ? <p className="ed-dash-line-chart__peak-caption">{peakCaption}</p> : null}
        </div>
      ) : null}
      <div className="ed-dash-line-chart__axis" id={labelId}>
        {points.map((point) => (
          <span key={point.key}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardHealthList({
  items,
}: {
  items: { label: string; value: string; tone?: "success" | "neutral"; info?: boolean }[];
}) {
  return (
    <ul className="ed-dash-health-list">
      {items.map((item) => (
        <li key={item.label} className="ed-dash-health-list__item">
          <span className="ed-dash-health-list__label">{item.label}</span>
          <span className={`ed-dash-health-list__value ed-dash-health-list__value--${item.tone ?? "success"}`}>
            {item.value}
            {item.info ? (
              <span className="ed-dash-health-list__info" aria-hidden>
                i
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardHighlightCard({
  title,
  subtitle,
  avatars,
  extraCount,
  className,
}: {
  title: string;
  subtitle: string;
  avatars: { key: string; label: string; imageUrl?: string | null }[];
  extraCount?: number;
  className?: string;
}) {
  return (
    <section className={["ed-dash-highlight", className].filter(Boolean).join(" ")}>
      <h3 className="ed-dash-highlight__title">{title}</h3>
      <p className="ed-dash-highlight__subtitle">{subtitle}</p>
      <div className="ed-dash-highlight__avatars" aria-label="Recent brands">
        {avatars.map((avatar) => (
          <span key={avatar.key} className="ed-dash-highlight__avatar" title={avatar.label}>
            {avatar.imageUrl ? <img src={avatar.imageUrl} alt="" /> : avatar.label}
          </span>
        ))}
        {extraCount && extraCount > 0 ? (
          <span className="ed-dash-highlight__avatar ed-dash-highlight__avatar--more">+{extraCount}</span>
        ) : null}
      </div>
    </section>
  );
}

export type DashboardOnboardingStatusTone = "completed" | "setup" | "pending";

export function DashboardOnboardingTable({
  columns,
  rows,
  emptyMessage = "No recent onboarding activity.",
}: {
  columns: { key: string; label: string; align?: "right" }[];
  rows: {
    key: string;
    cells: Record<string, ReactNode>;
  }[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="ed-dash-table__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-dash-table-wrap">
      <table className="ed-dash-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={column.align === "right" ? "ed-dash-table__align-right" : undefined}
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
                  className={column.align === "right" ? "ed-dash-table__align-right" : undefined}
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

export function DashboardStatusBadge({
  label,
  tone = "completed",
}: {
  label: string;
  tone?: DashboardOnboardingStatusTone;
}) {
  return (
    <span className={`ed-dash-status-badge ed-dash-status-badge--${tone}`}>
      <span className="ed-dash-status-badge__dot" aria-hidden />
      {label}
    </span>
  );
}

export function DashboardBrandCell({
  icon,
  name,
  meta,
}: {
  icon?: ReactNode;
  name: string;
  meta?: string;
}) {
  return (
    <div className="ed-dash-brand-cell">
      {icon ? <span className="ed-dash-brand-cell__icon" aria-hidden>{icon}</span> : null}
      <div>
        <p className="ed-dash-brand-cell__name">{name}</p>
        {meta ? <p className="ed-dash-brand-cell__meta">{meta}</p> : null}
      </div>
    </div>
  );
}

export function DashboardActivityFeed({
  items,
  emptyMessage = "No recent activity yet.",
}: {
  items: {
    key: string;
    icon: ReactNode;
    title: string;
    description: string;
    time: string;
    href?: string;
  }[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="ed-dash-activity__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-dash-activity">
      {items.map((item, index) => {
        const row = (
          <>
            <span className="ed-dash-activity__icon" aria-hidden>
              {item.icon}
            </span>
            <div className="ed-dash-activity__copy">
              <p className="ed-dash-activity__title">{item.title}</p>
              <p className="ed-dash-activity__description">{item.description}</p>
            </div>
            <span className="ed-dash-activity__time">{item.time}</span>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.key}
              to={item.href}
              className={`ed-dash-activity__row${index < items.length - 1 ? " ed-dash-activity__row--bordered" : ""}`}
            >
              {row}
            </Link>
          );
        }

        return (
          <div
            key={item.key}
            className={`ed-dash-activity__row${index < items.length - 1 ? " ed-dash-activity__row--bordered" : ""}`}
          >
            {row}
          </div>
        );
      })}
    </div>
  );
}

export function DashboardVisibility({
  mobile,
  desktop,
}: {
  mobile?: ReactNode;
  desktop?: ReactNode;
}) {
  return (
    <>
      {mobile ? <div className="ed-dash-only-mobile">{mobile}</div> : null}
      {desktop ? <div className="ed-dash-only-desktop">{desktop}</div> : null}
    </>
  );
}
