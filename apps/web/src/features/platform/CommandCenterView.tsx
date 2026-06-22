import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  DashboardActivityFeed,
  DashboardBrandCell,
  DashboardHealthList,
  DashboardHero,
  DashboardHighlightCard,
  DashboardLineChart,
  DashboardMetricCard,
  DashboardMetricGrid,
  DashboardOnboardingTable,
  DashboardPanel,
  DashboardQuickAction,
  DashboardQuickActionGrid,
  DashboardSectionHeader,
  DashboardSegmentedToggle,
  DashboardShell,
  DashboardSplit,
  DashboardStatusBadge,
  DashboardVisibility,
} from "@edunudg/ui";
import type { PlatformDashboardHome } from "@/lib/platformDashboardHelpers";
import {
  formatEnrollmentCount,
  platformDashboardGreeting,
} from "@/lib/platformDashboardHelpers";
import { formatCompactRelative } from "@/lib/brandDashboardHelpers";

const ICON_BUILDING = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
    <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
    <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
  </svg>
);

const ICON_NETWORK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M12 7v4M8.5 17.5 11 12M15.5 17.5 13 12" />
  </svg>
);

const ICON_PLAN = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 3h5v5" />
    <path d="M8 3H3v5" />
    <path d="M12 22v-8" />
    <path d="m21 3-9 9-4-4-6 6" />
  </svg>
);

const ICON_WALLET = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <path d="M3 7h18v10H3z" />
    <path d="M16 12h.01" />
  </svg>
);

const ICON_PLUS = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const ICON_SIGNAL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M2 20h.01M7 20v-4M12 20V10M17 20V4M22 20v-8" />
  </svg>
);

const ICON_CHART = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M3 3v18h18" />
    <path d="M7 16V9M12 16V5M17 16v-3" />
  </svg>
);

const ICON_MAIL = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M4 4h16v16H4z" />
    <path d="m22 6-10 7L2 6" />
  </svg>
);

function activityIcon(kind: PlatformDashboardHome["activities"][number]["kind"]) {
  if (kind === "billing") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    );
  }
  if (kind === "security") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      </svg>
    );
  }
  if (kind === "signup") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2Z" />
    </svg>
  );
}

function brandTableIcon(name: string) {
  const initial = name.trim().charAt(0).toUpperCase() || "B";
  return <span>{initial}</span>;
}

export function CommandCenterView({
  data,
  displayName,
  nowMs = Date.now(),
}: {
  data: PlatformDashboardHome;
  displayName: string;
  nowMs?: number;
}) {
  const [growthPeriod, setGrowthPeriod] = useState<"monthly" | "quarterly">("monthly");
  const greeting = platformDashboardGreeting(displayName, new Date(nowMs).getHours());
  const growthPoints = growthPeriod === "monthly" ? data.monthlyEnrollments : data.quarterlyEnrollments;

  const activityItems = useMemo(
    () =>
      data.activities.map((item) => ({
        key: item.id,
        icon: activityIcon(item.kind),
        title: item.title,
        description: item.description,
        time: formatCompactRelative(item.occurredAt, nowMs),
        href: item.href,
      })),
    [data.activities, nowMs]
  );

  return (
    <DashboardShell>
      <DashboardHero
        greeting={greeting}
        subtitle={
          <>
            <span className="ed-dash-hero__subtitle-short">Platform Owner</span>
            <span className="ed-dash-hero__subtitle-long">Platform Owner Dashboard</span>
          </>
        }
        action={
          <Link to="/admin/brands" className="ed-dash-hero__cta">
            {ICON_PLUS}
            New Brand
          </Link>
        }
      />

      <DashboardSectionHeader title="Executive Command Center" className="ed-dash-only-mobile" />

      <DashboardMetricGrid>
        <DashboardMetricCard
          label="Active brands"
          value={data.activeBrands}
          hint={`${data.totalBrands} total`}
          hintDesktop={`${data.activeBrands} active, ${Math.max(data.totalBrands - data.activeBrands, 0)} onboarding`}
          icon={ICON_BUILDING}
          iconTone="blue"
          trend={data.activeBrandsTrend ?? undefined}
          href="/admin/brands"
        />
        <DashboardMetricCard
          label="Franchise centers"
          value={data.totalCenters}
          hint={data.regionCount > 0 ? `Across ${data.regionCount} regions` : "Across all brands"}
          icon={ICON_NETWORK}
          iconTone="purple"
          trend={data.centersTrend ?? undefined}
          href="/admin/brands"
        />
        <DashboardMetricCard
          label="Subscription plans"
          value={data.planCount}
          hint={data.planNames}
          icon={ICON_PLAN}
          iconTone="green"
          trend={data.plansTrend ?? undefined}
          href="/admin/subscriptions"
          className="ed-dash-metric--desktop-only"
        />
        <DashboardMetricCard
          label="MRR (stub)"
          value="—"
          hint="Connect billing →"
          icon={ICON_WALLET}
          iconTone="magenta"
          trend="12.5%"
          trendTone="steady"
          href="/admin/revenue"
        />
      </DashboardMetricGrid>

      <DashboardVisibility
        mobile={
          <>
            <DashboardSectionHeader title="Quick Actions" />
            <DashboardQuickActionGrid>
              <DashboardQuickAction label="New Brand" icon={ICON_PLUS} tone="primary" href="/admin/brands" />
              <DashboardQuickAction label="System Status" icon={ICON_SIGNAL} tone="accent" href="/admin/settings" />
              <DashboardQuickAction label="Reports" icon={ICON_CHART} tone="muted" href="/admin/revenue" />
              <DashboardQuickAction label="Broadcast" icon={ICON_MAIL} tone="muted" href="/admin/settings" />
            </DashboardQuickActionGrid>

            <DashboardSectionHeader title="Recent Activity" actionLabel="See all" actionHref="/admin/audit" />
            <DashboardActivityFeed items={activityItems} />
          </>
        }
        desktop={
          <>
            <DashboardSplit
              main={
                <DashboardPanel
                  title="Network Growth"
                  subtitle="New student enrollments across all brands."
                  actions={
                    <DashboardSegmentedToggle
                      value={growthPeriod}
                      onChange={setGrowthPeriod}
                      options={[
                        { value: "monthly", label: "Monthly" },
                        { value: "quarterly", label: "Quarterly" },
                      ]}
                      aria-label="Growth period"
                    />
                  }
                >
                  <DashboardLineChart
                    points={growthPoints}
                    peakLabel={formatEnrollmentCount(data.peakEnrollment)}
                    peakCaption="New Enrollments"
                  />
                </DashboardPanel>
              }
              aside={
                <>
                  <DashboardPanel
                    title="Platform Health"
                    subtitle="Global system operational status."
                    statusDot="success"
                    footer={<Button variant="secondary" block>View Full Status</Button>}
                  >
                    <DashboardHealthList
                      items={[
                        { label: "API Performance", value: "99.9%", tone: "success" },
                        { label: "DB Replication", value: "Healthy", tone: "success" },
                        { label: "WAF/Security", value: "Active", tone: "success", info: true },
                      ]}
                    />
                  </DashboardPanel>

                  <DashboardHighlightCard
                    title="Enterprise Focus"
                    subtitle={`${data.enterpriseLeadsConverted} new leads converted this week.`}
                    avatars={data.enterpriseAvatars}
                    extraCount={data.extraEnterpriseCount}
                  />
                </>
              }
            />

            <DashboardSectionHeader title="Recent Brand Onboarding" actionLabel="See all activity" actionHref="/admin/brands" />
            <DashboardPanel>
              <DashboardOnboardingTable
                columns={[
                  { key: "brand", label: "Brand name" },
                  { key: "plan", label: "Plan" },
                  { key: "centers", label: "Centers" },
                  { key: "status", label: "Onboarding status" },
                  { key: "actions", label: "Actions", align: "right" },
                ]}
                rows={data.onboardingRows.map((row) => ({
                  key: row.id,
                  cells: {
                    brand: (
                      <DashboardBrandCell
                        icon={brandTableIcon(row.name)}
                        name={row.name}
                        meta={row.meta}
                      />
                    ),
                    plan: row.planName,
                    centers: `${row.centerCount} ${row.centerCount === 1 ? "Center" : "Centers"}`,
                    status: <DashboardStatusBadge label={row.statusLabel} tone={row.status} />,
                    actions: (
                      <Link to={`/admin/brands/${row.slug}`} className="ed-dash-section-header__link" aria-label={`Open ${row.name}`}>
                        ⋯
                      </Link>
                    ),
                  },
                }))}
              />
            </DashboardPanel>
          </>
        }
      />
    </DashboardShell>
  );
}
