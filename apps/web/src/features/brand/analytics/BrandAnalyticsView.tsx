import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnalyticsActivityList,
  AnalyticsKpiCard,
  AnalyticsKpiGrid,
  AnalyticsPanel,
  PeriodToggle,
  TopCenterRankList,
  TopCenterScrollCards,
  TrendBarChart,
  type AnalyticsTrendTone,
} from "@edunudg/ui";
import type { BrandAnalyticsStats } from "@/lib/brandAnalyticsStats";
import { formatInrFromPaise } from "@/hooks/useBrandMonitoringStats";
import {
  buildAnalyticsActivityFeed,
  buildChartAxisLabels,
  buildEnrollmentChartBars,
  centerInitials,
  centersTrendLabel,
  computeEnrollmentTrendPercent,
  computeRoyaltyTrendPercent,
  enrollmentTrendLabel,
  formatActivityTime,
  formatCenterSlug,
  formatCentersKpiHint,
  formatEnrollmentKpiHint,
  formatRoyaltyKpiHint,
  formatRoyaltyKpiValue,
  formatStudentsKpiHint,
  royaltyTrendLabel,
  type AnalyticsChartPeriod,
  type AnalyticsDateRange,
} from "@/lib/brandAnalyticsHelpers";
import { PerformanceBreakdown } from "./PerformanceBreakdown";
import "./brandAnalytics.css";

function IconEnrollments() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 3v18h18" />
      <path d="M7 14l4-4 3 3 5-6" />
    </svg>
  );
}

function IconStudents() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

function IconCenters() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function IconRoyalty() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconLeads() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11v6M19 14h6" />
    </svg>
  );
}

function activityIcon(kind: "enrollment" | "royalty" | "audit") {
  if (kind === "enrollment") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M16 11h6" />
      </svg>
    );
  }
  if (kind === "royalty") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function trendTone(percent: number | null): AnalyticsTrendTone | undefined {
  if (percent == null) return "steady";
  if (percent > 0) return "up";
  if (percent < 0) return "down";
  return "steady";
}

function DesktopKpis({ stats }: { stats: BrandAnalyticsStats }) {
  const enrollmentTrend = computeEnrollmentTrendPercent(stats.recentDaily);
  const royaltyTrend = computeRoyaltyTrendPercent(stats.recentDaily);

  return (
    <AnalyticsKpiGrid>
      <AnalyticsKpiCard
        label="New Enrollments (30D)"
        value={stats.enrollments30d.toLocaleString("en-IN")}
        hint={formatEnrollmentKpiHint(stats, enrollmentTrend)}
        icon={<IconEnrollments />}
        iconTone="blue"
        trend={trendTone(enrollmentTrend)}
        trendLabel={enrollmentTrendLabel(enrollmentTrend) ?? "Steady"}
      />
      <AnalyticsKpiCard
        label="Total Students"
        value={stats.students.toLocaleString("en-IN")}
        hint={formatStudentsKpiHint(stats)}
        icon={<IconStudents />}
        iconTone="purple"
        trend="steady"
        trendLabel="Steady"
      />
      <AnalyticsKpiCard
        label="Active Centers"
        value={stats.centersActive.toLocaleString("en-IN")}
        hint={formatCentersKpiHint(stats)}
        icon={<IconCenters />}
        iconTone="magenta"
        trend={centersTrendLabel(stats) ? "up" : "steady"}
        trendLabel={centersTrendLabel(stats) ?? "Steady"}
      />
      <AnalyticsKpiCard
        label="Royalty Collected"
        value={formatRoyaltyKpiValue(stats.revenue30dCents)}
        hint={formatRoyaltyKpiHint(stats)}
        icon={<IconRoyalty />}
        iconTone="green"
        trend={trendTone(royaltyTrend)}
        trendLabel={royaltyTrendLabel(royaltyTrend) ?? "Steady"}
      />
    </AnalyticsKpiGrid>
  );
}

function MobileKpis({ stats }: { stats: BrandAnalyticsStats }) {
  const enrollmentTrend = computeEnrollmentTrendPercent(stats.recentDaily);

  return (
    <AnalyticsKpiGrid>
      <AnalyticsKpiCard
        label="New enrollments (30d)"
        value={stats.enrollments30d}
        hint={`${stats.enrollmentsActive} active total`}
        icon={<IconEnrollments />}
        iconTone="blue"
        trend={trendTone(enrollmentTrend)}
        trendLabel={enrollmentTrendLabel(enrollmentTrend)}
      />
      <AnalyticsKpiCard
        label="Active Centers"
        value={`${stats.centersActive} / ${stats.centersTotal}`}
        hint={stats.centersActive === stats.centersTotal ? "100% operational" : formatCentersKpiHint(stats)}
        icon={<IconCenters />}
        iconTone="magenta"
      />
      <AnalyticsKpiCard
        label="Royalty (30d)"
        value={formatInrFromPaise(stats.revenue30dCents)}
        hint={stats.revenue30dCents > 0 ? "Paid in period" : "Settlements pending"}
        icon={<IconRoyalty />}
        iconTone="green"
      />
      <AnalyticsKpiCard
        label="Open Leads"
        value={stats.leadsOpen}
        hint={stats.leadsOpen > 0 ? "Follow-up required" : "Pipeline clear"}
        icon={<IconLeads />}
        iconTone="blue"
      />
    </AnalyticsKpiGrid>
  );
}

export function BrandAnalyticsView({
  stats,
  isMobile,
  nowMs = Date.now(),
}: {
  stats: BrandAnalyticsStats;
  isMobile: boolean;
  nowMs?: number;
}) {
  const [chartDays, setChartDays] = useState<AnalyticsChartPeriod>(14);
  const [dateRange, setDateRange] = useState<AnalyticsDateRange | null>(null);

  function handleDaysChange(days: AnalyticsChartPeriod) {
    setChartDays(days);
    setDateRange(null);
  }

  const chartBars = useMemo(
    () => buildEnrollmentChartBars(stats.recentDaily, chartDays, dateRange),
    [stats.recentDaily, chartDays, dateRange]
  );
  const axisLabels = useMemo(
    () => buildChartAxisLabels(stats.recentDaily, chartDays, dateRange),
    [stats.recentDaily, chartDays, dateRange]
  );
  const activities = useMemo(() => buildAnalyticsActivityFeed(stats, nowMs), [stats, nowMs]);

  const topCentersDesktop = stats.topCenters.map((center) => ({
    id: center.id,
    name: center.name,
    location: center.slug ? formatCenterSlug(center.slug) : undefined,
    enrollments: center.enrollments30d,
    initials: centerInitials(center.name),
  }));

  const topCentersMobile = stats.topCenters.map((center, index) => ({
    id: center.id,
    name: center.name,
    location: center.slug ? formatCenterSlug(center.slug) : undefined,
    enrollments: center.enrollments30d,
    featured: index === 0,
  }));

  return (
    <div className="ed-brand-analytics">
      <header className="ed-brand-analytics__header">
        <h1 className="ed-brand-analytics__title">Analytics</h1>
        <p className="ed-brand-analytics__subtitle">
          Live metrics from your franchise network — enrollment, centers, and royalties.
        </p>
      </header>

      {isMobile ? <MobileKpis stats={stats} /> : <DesktopKpis stats={stats} />}

      <div className="ed-brand-analytics__main">
        <AnalyticsPanel
          title="Daily Enrollment Trend"
          className="ed-brand-analytics__chart-panel"
          badge={dateRange ? `${dateRange.from} → ${dateRange.to}` : isMobile ? `Last ${chartDays} days` : undefined}
          actions={
            !isMobile ? (
              <PeriodToggle
                value={dateRange ? 0 : chartDays}
                onChange={(days) => handleDaysChange(days as AnalyticsChartPeriod)}
              />
            ) : null
          }
        >
          {isMobile ? null : (
            <div className="ed-brand-analytics__chart-head">
              <span className="sr-only">Enrollment trend period</span>
            </div>
          )}
          <TrendBarChart
            bars={chartBars}
            axisLabels={axisLabels}
            emptyMessage="No enrollments in this period yet. Converting leads will populate this chart."
          />
        </AnalyticsPanel>

        <div className="ed-brand-analytics__desktop-only">
          <AnalyticsPanel title="Top Centers (30d)">
            <TopCenterRankList centers={topCentersDesktop} viewAllHref="/app/centers" />
          </AnalyticsPanel>
        </div>
      </div>

      {isMobile ? (
        <>
          <section>
            <div className="ed-brand-analytics__section-head">
              <h2 className="ed-brand-analytics__section-title">Recent Activity</h2>
              <Link to="/app/centers" className="ed-brand-analytics__section-link">
                View All
              </Link>
            </div>
            <AnalyticsActivityList
              items={activities.map((item) => ({
                key: item.id,
                icon: activityIcon(item.kind),
                iconTone: item.kind === "royalty" ? "green" : item.kind === "audit" ? "purple" : "blue",
                title: item.title,
                subtitle: item.subtitle,
                value: item.value,
                valueTone: item.valueTone,
                time: formatActivityTime(item.occurredAt, nowMs),
                href: item.href,
              }))}
            />
          </section>

          <section>
            <h2 className="ed-brand-analytics__section-title">Top Centers (30d)</h2>
            <TopCenterScrollCards centers={topCentersMobile} />
          </section>

          <PerformanceBreakdown
            stats={stats}
            days={chartDays}
            onDaysChange={handleDaysChange}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </>
      ) : (
        <PerformanceBreakdown
          stats={stats}
          days={chartDays}
          onDaysChange={handleDaysChange}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    </div>
  );
}
