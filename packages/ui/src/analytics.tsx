import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";

export type AnalyticsTrendTone = "up" | "down" | "steady" | "neutral";

export function AnalyticsKpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={["ed-analytics-kpi-grid", className].filter(Boolean).join(" ")}>{children}</div>;
}

export function AnalyticsKpiCard({
  label,
  value,
  hint,
  icon,
  iconTone = "blue",
  trend,
  trendLabel,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
  iconTone?: "blue" | "purple" | "magenta" | "green";
  trend?: AnalyticsTrendTone;
  trendLabel?: string;
}) {
  const trendClass =
    trend === "up"
      ? "ed-analytics-kpi__trend--up"
      : trend === "down"
        ? "ed-analytics-kpi__trend--down"
        : trend === "steady"
          ? "ed-analytics-kpi__trend--steady"
          : "";

  return (
    <article className="ed-analytics-kpi">
      <div className="ed-analytics-kpi__head">
        <span className={`ed-analytics-kpi__icon ed-analytics-kpi__icon--${iconTone}`} aria-hidden>
          {icon}
        </span>
        {trendLabel ? (
          <span className={["ed-analytics-kpi__trend", trendClass].filter(Boolean).join(" ")}>{trendLabel}</span>
        ) : null}
      </div>
      <p className="ed-analytics-kpi__label">{label}</p>
      <p className="ed-analytics-kpi__value">{value}</p>
      {hint ? <p className="ed-analytics-kpi__hint">{hint}</p> : null}
    </article>
  );
}

export function PeriodToggle({
  value,
  onChange,
  options = [
    { value: 14, label: "14D" },
    { value: 30, label: "30D" },
  ],
  "aria-label": ariaLabel = "Chart period",
}: {
  value: number;
  onChange: (days: number) => void;
  options?: { value: number; label: string }[];
  "aria-label"?: string;
}) {
  return (
    <div className="ed-analytics-period" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`ed-analytics-period__btn${value === opt.value ? " is-active" : ""}`}
          aria-pressed={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export type TrendBar = {
  key: string;
  heightPercent: number;
  isHighlight?: boolean;
  title?: string;
};

export function TrendBarChart({
  bars,
  axisLabels,
  emptyMessage = "No data in this period yet.",
}: {
  bars: TrendBar[];
  axisLabels?: { start?: string; middle?: string; end?: string };
  emptyMessage?: string;
}) {
  const labelId = useId();
  const hasData = bars.some((bar) => bar.heightPercent > 0);

  if (!hasData) {
    return <p className="ed-analytics-chart__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-analytics-chart" aria-labelledby={labelId}>
      <div className="ed-analytics-chart__bars" role="img" aria-label="Enrollment trend chart">
        {bars.map((bar) => (
          <div key={bar.key} className="ed-analytics-chart__bar-col" title={bar.title}>
            <div className="ed-analytics-chart__bar-track">
              <span
                className={`ed-analytics-chart__bar${bar.isHighlight ? " ed-analytics-chart__bar--highlight" : ""}`}
                style={{ height: `${Math.max(bar.heightPercent, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      {axisLabels ? (
        <div className="ed-analytics-chart__axis">
          <span>{axisLabels.start}</span>
          <span>{axisLabels.middle}</span>
          <span>{axisLabels.end}</span>
        </div>
      ) : null}
    </div>
  );
}

export function AnalyticsPanel({
  title,
  badge,
  actions,
  children,
  className,
}: {
  title: string;
  badge?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={["ed-analytics-panel", className].filter(Boolean).join(" ")}>
      <div className="ed-analytics-panel__head">
        <div className="ed-analytics-panel__title-row">
          <h2 className="ed-analytics-panel__title">{title}</h2>
          {badge ? <span className="ed-analytics-panel__badge">{badge}</span> : null}
        </div>
        {actions ? <div className="ed-analytics-panel__actions">{actions}</div> : null}
      </div>
      <div className="ed-analytics-panel__body">{children}</div>
    </section>
  );
}

export type AnalyticsStatus = "processed" | "pending";

export function StatusPill({ status, children }: { status: AnalyticsStatus; children?: ReactNode }) {
  const label = children ?? (status === "processed" ? "Processed" : "Pending");
  return <span className={`ed-analytics-status ed-analytics-status--${status}`}>{label}</span>;
}

export function AnalyticsDataTable({
  columns,
  rows,
  emptyMessage = "No rows to display.",
}: {
  columns: { key: string; label: string; align?: "left" | "right" }[];
  rows: { key: string; cells: Record<string, ReactNode> }[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return <p className="ed-analytics-table__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-analytics-table-wrap">
      <table className="ed-analytics-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.align === "right" ? "ed-analytics-table__align-right" : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {columns.map((col) => (
                <td key={col.key} className={col.align === "right" ? "ed-analytics-table__align-right" : undefined}>
                  {row.cells[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsActivityList({
  items,
  emptyMessage = "No recent activity yet.",
}: {
  items: {
    key: string;
    icon: ReactNode;
    iconTone?: "blue" | "green" | "purple";
    title: string;
    subtitle: string;
    value?: ReactNode;
    valueTone?: "primary" | "success";
    time: string;
    href?: string;
  }[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="ed-analytics-activity__empty">{emptyMessage}</p>;
  }

  return (
    <ul className="ed-analytics-activity">
      {items.map((item) => {
        const content = (
          <>
            <span className={`ed-analytics-activity__icon ed-analytics-activity__icon--${item.iconTone ?? "blue"}`}>
              {item.icon}
            </span>
            <div className="ed-analytics-activity__copy">
              <p className="ed-analytics-activity__title">{item.title}</p>
              <p className="ed-analytics-activity__subtitle">{item.subtitle}</p>
            </div>
            <div className="ed-analytics-activity__meta">
              {item.value ? (
                <span
                  className={[
                    "ed-analytics-activity__value",
                    item.valueTone === "success" ? "ed-analytics-activity__value--success" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {item.value}
                </span>
              ) : null}
              <span className="ed-analytics-activity__time">{item.time}</span>
            </div>
          </>
        );

        return (
          <li key={item.key}>
            {item.href ? (
              <Link to={item.href} className="ed-analytics-activity__row">
                {content}
              </Link>
            ) : (
              <div className="ed-analytics-activity__row">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function TopCenterRankList({
  centers,
  emptyMessage = "Center rankings appear once enrollments are recorded.",
  viewAllHref,
  viewAllLabel = "View All Performance Stats",
}: {
  centers: {
    id: string;
    name: string;
    location?: string;
    enrollments: number;
    trendPercent?: number | null;
    avatarUrl?: string;
    initials?: string;
  }[];
  emptyMessage?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  if (centers.length === 0) {
    return <p className="ed-analytics-top-centers__empty">{emptyMessage}</p>;
  }

  return (
    <>
      <ul className="ed-analytics-top-centers">
        {centers.map((center) => (
          <li key={center.id} className="ed-analytics-top-centers__item">
            <span className="ed-analytics-top-centers__avatar" aria-hidden>
              {center.avatarUrl ? (
                <img src={center.avatarUrl} alt="" />
              ) : (
                <span>{center.initials ?? center.name.slice(0, 2).toUpperCase()}</span>
              )}
            </span>
            <div className="ed-analytics-top-centers__copy">
              <p className="ed-analytics-top-centers__name">{center.name}</p>
              {center.location ? <p className="ed-analytics-top-centers__location">{center.location}</p> : null}
            </div>
            <div className="ed-analytics-top-centers__stats">
              <strong>{center.enrollments}</strong>
              {center.trendPercent != null ? (
                <span
                  className={
                    center.trendPercent >= 0
                      ? "ed-analytics-top-centers__trend ed-analytics-top-centers__trend--up"
                      : "ed-analytics-top-centers__trend ed-analytics-top-centers__trend--down"
                  }
                >
                  {center.trendPercent >= 0 ? "↑" : "↓"} {Math.abs(center.trendPercent)}%
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {viewAllHref ? (
        <Link to={viewAllHref} className="ed-analytics-top-centers__link">
          {viewAllLabel}
        </Link>
      ) : null}
    </>
  );
}

export function TopCenterScrollCards({
  centers,
  emptyMessage = "Center rankings appear once enrollments are recorded.",
}: {
  centers: {
    id: string;
    name: string;
    location?: string;
    enrollments: number;
    featured?: boolean;
  }[];
  emptyMessage?: string;
}) {
  if (centers.length === 0) {
    return <p className="ed-analytics-top-centers__empty">{emptyMessage}</p>;
  }

  return (
    <div className="ed-analytics-top-centers-scroll">
      {centers.map((center) => (
        <article
          key={center.id}
          className={`ed-analytics-top-centers-scroll__card${center.featured ? " is-featured" : ""}`}
        >
          <h3 className="ed-analytics-top-centers-scroll__name">{center.name}</h3>
          {center.location ? <p className="ed-analytics-top-centers-scroll__location">{center.location}</p> : null}
          <span
            className={`ed-analytics-top-centers-scroll__badge${
              center.enrollments > 0 ? " ed-analytics-top-centers-scroll__badge--active" : ""
            }`}
          >
            {center.enrollments} enrollments
          </span>
        </article>
      ))}
    </div>
  );
}
