import { Link } from "react-router-dom";
import type { BrandDashboardHome } from "@/lib/brandDashboardHomeApi";
import {
  brandDashboardGreeting,
  formatCompactRelative,
  formatInrCompact,
  franchiseAppsHint,
  staleLeadsHint,
  unassignedLeadsHint,
  type BrandDashboardActivityKind,
} from "@/lib/brandDashboardHelpers";
import "./brandDashboard.css";

const CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

function KpiIconLeads() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 11v6M19 14h6" />
    </svg>
  );
}

function KpiIconFranchise() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function KpiIconStale() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function activityIcon(kind: BrandDashboardActivityKind) {
  if (kind === "application") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  }
  if (kind === "lead") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  if (kind === "onboarding") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M12 18v-6M9 15h6" />
    </svg>
  );
}

function RevenueCard({ data }: { data: BrandDashboardHome }) {
  const trend =
    data.revenueTrendPercent != null
      ? `${data.revenueTrendPercent >= 0 ? "+" : ""}${data.revenueTrendPercent}% vs LW`
      : null;

  return (
    <section className="ed-brand-dash__revenue" aria-label="Revenue outlook">
      <p className="ed-brand-dash__revenue-label">Revenue Outlook</p>
      <p className="ed-brand-dash__revenue-value">
        {formatInrCompact(data.revenueTotalCents)}
        {trend ? <span className="ed-brand-dash__revenue-trend">{trend}</span> : null}
      </p>
      <div className="ed-brand-dash__revenue-bars" aria-hidden>
        {data.revenueBars.map((scale, index) => (
          <span key={index} style={{ height: `${Math.max(scale * 100, 12)}%` }} />
        ))}
      </div>
    </section>
  );
}

function CenterHealthCard({ data }: { data: BrandDashboardHome }) {
  return (
    <section className="ed-brand-dash__panel ed-brand-dash__health" aria-label="Center health">
      <h3 className="ed-brand-dash__health-title">Center Health</h3>
      <p className="ed-brand-dash__health-copy">
        {data.centerHealthPercent}% of centers are operating at target margin.
      </p>
      <div className="ed-brand-dash__health-bar" aria-hidden>
        <span style={{ width: `${data.centerHealthPercent}%` }} />
      </div>
      <div className="ed-brand-dash__avatars" aria-label="Top performing centers">
        {data.centerAvatars.map((avatar) => (
          <span
            key={avatar.initials}
            className={`ed-brand-dash__avatar ed-brand-dash__avatar--${avatar.tone}`}
          >
            {avatar.initials}
          </span>
        ))}
        {data.extraCenterCount > 0 ? (
          <span className="ed-brand-dash__avatar ed-brand-dash__avatar--more">+{data.extraCenterCount}</span>
        ) : null}
      </div>
    </section>
  );
}

function KpiSection({ data }: { data: BrandDashboardHome }) {
  return (
    <div className="ed-brand-dash__kpis">
      <Link to="/app/leads" className="ed-brand-dash__kpi">
        <div className="ed-brand-dash__kpi-head">
          <span className="ed-brand-dash__kpi-icon ed-brand-dash__kpi-icon--blue">
            <KpiIconLeads />
          </span>
          {data.unassignedLeadsTrend != null && data.unassignedLeadsTrend !== 0 ? (
            <span className="ed-brand-dash__kpi-badge ed-brand-dash__kpi-badge--up">
              {data.unassignedLeadsTrend > 0 ? "↑" : "↓"} {Math.abs(data.unassignedLeadsTrend)}%
            </span>
          ) : null}
        </div>
        <p className="ed-brand-dash__kpi-label">Unassigned Leads</p>
        <p className="ed-brand-dash__kpi-value">{data.unassignedLeads}</p>
        <p className="ed-brand-dash__kpi-hint">{unassignedLeadsHint(data.unassignedLeads)}</p>
      </Link>

      <div className="ed-brand-dash__kpi-row">
        <Link to="/app/franchise-applications" className="ed-brand-dash__kpi">
          <div className="ed-brand-dash__kpi-head">
            <span className="ed-brand-dash__kpi-icon ed-brand-dash__kpi-icon--purple">
              <KpiIconFranchise />
            </span>
            {data.pendingFranchiseApps > 0 ? (
              <span className="ed-brand-dash__kpi-badge ed-brand-dash__kpi-badge--new">New</span>
            ) : null}
          </div>
          <p className="ed-brand-dash__kpi-label">Franchise Apps</p>
          <p className="ed-brand-dash__kpi-value">{data.pendingFranchiseApps}</p>
          <p className="ed-brand-dash__kpi-hint">{franchiseAppsHint(data.pendingFranchiseApps)}</p>
        </Link>

        <Link to="/app/leads" className="ed-brand-dash__kpi ed-brand-dash__kpi--alert ed-brand-dash__kpi--stale">
          <div className="ed-brand-dash__kpi-main">
            <span className="ed-brand-dash__kpi-icon ed-brand-dash__kpi-icon--red">
              <KpiIconStale />
            </span>
            <div>
              <p className="ed-brand-dash__kpi-label">Stale Leads (&gt;48h)</p>
              <p className="ed-brand-dash__kpi-value ed-brand-dash__kpi-value--danger">{data.staleLeads}</p>
              <p className="ed-brand-dash__kpi-hint ed-brand-dash__kpi-hint--danger">
                {staleLeadsHint(data.staleLeads)}
              </p>
            </div>
          </div>
          {data.staleLeads > 0 ? (
            <span className="ed-brand-dash__kpi-action">Action Required</span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}

function ActivitySection({ data, nowMs }: { data: BrandDashboardHome; nowMs: number }) {
  return (
    <section className="ed-brand-dash__panel">
      <div className="ed-brand-dash__panel-head">
        <h2 className="ed-brand-dash__panel-title">Recent Activity</h2>
        <Link to="/app/franchise-applications" className="ed-brand-dash__panel-link">
          See All
        </Link>
      </div>
      {data.activities.length === 0 ? (
        <p className="ed-brand-dash__empty">No recent activity yet.</p>
      ) : (
        data.activities.map((item) => (
          <Link key={item.id} to={item.href} className="ed-brand-dash__activity">
            <span className={`ed-brand-dash__activity-icon ed-brand-dash__activity-icon--${item.kind}`}>
              {activityIcon(item.kind)}
            </span>
            <div className="ed-brand-dash__activity-copy">
              <p className="ed-brand-dash__activity-title">{item.title}</p>
              <p className="ed-brand-dash__activity-subtitle">{item.subtitle}</p>
            </div>
            <div className="ed-brand-dash__activity-meta">
              <span>{formatCompactRelative(item.occurredAt, nowMs)}</span>
              {CHEVRON}
            </div>
          </Link>
        ))
      )}
    </section>
  );
}

export function BrandDashboardView({
  data,
  displayName,
  nowMs = Date.now(),
}: {
  data: BrandDashboardHome;
  displayName: string;
  nowMs?: number;
}) {
  const greeting = brandDashboardGreeting(displayName, new Date(nowMs).getHours());

  return (
    <div className="ed-brand-dash">
      <header className="ed-brand-dash__header">
        <div className="ed-brand-dash__header-copy">
          <p className="ed-brand-dash__greeting ed-brand-dash__greeting--mobile-first">{greeting}</p>
          <h1 className="ed-brand-dash__title">Today at a glance</h1>
          <p className="ed-brand-dash__greeting ed-brand-dash__greeting--desktop">{greeting}</p>
        </div>
        <Link to="/app/franchise-applications" className="ed-brand-dash__cta">
          + New Center Proposal
        </Link>
      </header>

      <KpiSection data={data} />

      <div className="ed-brand-dash__main">
        <ActivitySection data={data} nowMs={nowMs} />

        <aside className="ed-brand-dash__aside ed-brand-dash__aside--desktop">
          <RevenueCard data={data} />
          <CenterHealthCard data={data} />
        </aside>
      </div>

      <div className="ed-brand-dash__revenue-mobile">
        <RevenueCard data={data} />
      </div>

      <div className="ed-brand-dash__mobile-health">
        <CenterHealthCard data={data} />
      </div>

      <div className="ed-brand-dash__bottom">
        <section className="ed-brand-dash__expansion">
          <h3 className="ed-brand-dash__expansion-title">Expansion Goals</h3>
          {data.expansionGoals.length === 0 ? (
            <p className="ed-brand-dash__empty">Add center regions to track expansion goals.</p>
          ) : (
            data.expansionGoals.map((goal) => (
              <div key={goal.id} className="ed-brand-dash__goal">
                <div className="ed-brand-dash__goal-head">
                  <span>{goal.label}</span>
                  <strong>{goal.percent}%</strong>
                </div>
                <div className="ed-brand-dash__goal-bar" aria-hidden>
                  <span style={{ width: `${goal.percent}%` }} />
                </div>
              </div>
            ))
          )}
          <Link to="/app/analytics" className="ed-brand-dash__strategy-btn">
            Global Expansion Strategy
          </Link>
        </section>

        <section className="ed-brand-dash__network" aria-label="Network distribution">
          <div className="ed-brand-dash__network-overlay">
            <strong>Network Distribution</strong>
            <span>
              {data.activeCenters} Active Hubs • {data.pendingCenters} Pending
            </span>
          </div>
        </section>
      </div>

      <Link to="/app/franchise-applications" className="ed-brand-dash__fab" aria-label="New center proposal">
        +
      </Link>
    </div>
  );
}
