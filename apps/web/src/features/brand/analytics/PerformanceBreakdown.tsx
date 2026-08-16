import { PeriodToggle, AnalyticsDataTable, StatusPill, type AnalyticsStatus } from "@edunudg/ui";
import type { BrandAnalyticsStats } from "@/lib/brandAnalyticsStats";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import {
  availableTrendBounds,
  buildPerformanceSnapshot,
  buildPerformanceTableRows,
  clampDateRange,
  downloadPerformanceCsv,
  enrollmentTrendLabel,
  formatRoyaltyKpiValue,
  normalizeDateRange,
  presetWindowRange,
  type AnalyticsChartPeriod,
  type AnalyticsDateRange,
} from "@/lib/brandAnalyticsHelpers";

function snapshotTrend(percent: number | null): string {
  if (percent == null) return "No prior window";
  const label = enrollmentTrendLabel(percent);
  return label ? `${label} vs last period` : "Steady vs last period";
}

export function PerformanceBreakdown({
  stats,
  days,
  onDaysChange,
  dateRange,
  onDateRangeChange,
}: {
  stats: BrandAnalyticsStats;
  days: AnalyticsChartPeriod;
  onDaysChange: (days: AnalyticsChartPeriod) => void;
  dateRange: AnalyticsDateRange | null;
  onDateRangeChange: (range: AnalyticsDateRange | null) => void;
}) {
  const bounds = availableTrendBounds(stats.recentDaily);
  const snapshot = buildPerformanceSnapshot(stats, days, dateRange);
  const rows = buildPerformanceTableRows(stats.recentDaily, days, { range: dateRange });
  const enrollmentTotal = rows.reduce((sum, row) => sum + row.enrollments, 0);
  const royaltyTotal = rows.reduce((sum, row) => sum + row.royaltyCents, 0);
  const displayRange = dateRange ?? presetWindowRange(stats.recentDaily, days);
  const badge = dateRange
    ? `${dateRange.from} → ${dateRange.to}`
    : `Last ${days} days`;

  function applyDate(nextFrom: string, nextTo: string) {
    const normalized = normalizeDateRange(nextFrom, nextTo);
    if (!normalized || !bounds) {
      onDateRangeChange(null);
      return;
    }
    onDateRangeChange(clampDateRange(normalized, bounds));
  }

  return (
    <section className="ed-analytics-panel ed-brand-analytics__breakdown" aria-labelledby="performance-breakdown-title">
      <div className="ed-analytics-panel__head">
        <div className="ed-analytics-panel__title-row">
          <h2 id="performance-breakdown-title" className="ed-analytics-panel__title">
            Performance Breakdown
          </h2>
          <span className="ed-analytics-panel__badge">{badge}</span>
        </div>
        <div className="ed-analytics-panel__actions">
          <PeriodToggle
            value={dateRange ? 0 : days}
            onChange={(value) => onDaysChange(value as AnalyticsChartPeriod)}
            aria-label="Performance period"
          />
          <div className="ed-brand-analytics__dates">
            <label className="ed-brand-analytics__date">
              <span>From</span>
              <input
                type="date"
                value={displayRange?.from ?? ""}
                min={bounds?.min}
                max={bounds?.max}
                onChange={(event) => applyDate(event.target.value, displayRange?.to ?? event.target.value)}
              />
            </label>
            <label className="ed-brand-analytics__date">
              <span>To</span>
              <input
                type="date"
                value={displayRange?.to ?? ""}
                min={bounds?.min}
                max={bounds?.max}
                onChange={(event) => applyDate(displayRange?.from ?? event.target.value, event.target.value)}
              />
            </label>
          </div>
          <button
            type="button"
            className="ed-brand-analytics__export-btn"
            onClick={() => downloadPerformanceCsv(stats.recentDaily, days, dateRange)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="M7 10l5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
      <div className="ed-analytics-panel__body">
        <p className="ed-brand-analytics__headline">{snapshot.headline}</p>
        <div className="ed-brand-analytics__snapshot">
          <article className="ed-brand-analytics__snap-card">
            <p className="ed-brand-analytics__snap-label">New enrollments</p>
            <p className="ed-brand-analytics__snap-value">{snapshot.enrollments.toLocaleString("en-IN")}</p>
            <p className="ed-brand-analytics__snap-hint">{snapshotTrend(snapshot.enrollmentTrendPercent)}</p>
          </article>
          <article className="ed-brand-analytics__snap-card">
            <p className="ed-brand-analytics__snap-label">Royalty collected</p>
            <p className="ed-brand-analytics__snap-value">{formatRoyaltyKpiValue(snapshot.royaltyCollectedCents)}</p>
            <p className="ed-brand-analytics__snap-hint">
              {snapshot.royaltyPendingCents > 0
                ? `${formatInrFromPaise(snapshot.royaltyPendingCents)} still due`
                : "No open settlements"}
            </p>
          </article>
          <article className="ed-brand-analytics__snap-card">
            <p className="ed-brand-analytics__snap-label">Peak day</p>
            <p className="ed-brand-analytics__snap-value">
              {snapshot.peakEnrollments > 0 ? snapshot.peakEnrollments : "—"}
            </p>
            <p className="ed-brand-analytics__snap-hint">
              {snapshot.peakDate ? `${snapshot.peakDate} · ${snapshot.centersEnrolling} centers` : "No enrollment spike yet"}
            </p>
          </article>
          <article className="ed-brand-analytics__snap-card">
            <p className="ed-brand-analytics__snap-label">Live days</p>
            <p className="ed-brand-analytics__snap-value">
              {snapshot.activityDays}/{snapshot.windowDays}
            </p>
            <p className="ed-brand-analytics__snap-hint">
              {stats.centersActive} active centers in the network
            </p>
          </article>
        </div>
        <AnalyticsDataTable
          columns={[
            { key: "date", label: "Date" },
            { key: "enrollments", label: "New Enrollments" },
            { key: "activeCenters", label: "Centers", align: "right" },
            { key: "royalty", label: "Royalty collected", align: "right" },
            { key: "status", label: "Pulse" },
          ]}
          rows={rows.map((row) => ({
            key: row.key,
            highlight: row.highlight,
            cells: {
              date: row.date,
              enrollments: <span className="ed-analytics-table__enrollments">{row.enrollments}</span>,
              activeCenters: row.activeCenters,
              royalty: row.royalty,
              status: <StatusPill status={row.status as AnalyticsStatus} />,
            },
          }))}
          footer={
            rows.length > 0
              ? {
                  date: "Period total",
                  enrollments: enrollmentTotal.toLocaleString("en-IN"),
                  activeCenters: "",
                  royalty: formatInrFromPaise(royaltyTotal),
                  status: "",
                }
              : undefined
          }
          emptyMessage="No enrollments or royalty collections in this period yet. Convert leads and record paid settlements to see the daily pulse."
        />
      </div>
    </section>
  );
}
