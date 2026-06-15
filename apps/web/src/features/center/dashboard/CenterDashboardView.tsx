import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { DashboardActionItem, DashboardBatchCard } from "@/lib/centerDashboardHelpers";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import type { CenterDashboardHome } from "@/lib/centerDashboardHomeApi";
import "@/features/center/dashboard/centerDashboard.css";

const CHEVRON = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const PIN = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

function KpiIconLeads() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function KpiIconBatches() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function KpiIconFees() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function actionIcon(item: DashboardActionItem) {
  if (item.kind === "lead") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M22 2 11 13" />
        <path d="M22 2 15 22l-4-9-9-4z" />
      </svg>
    );
  }
  if (item.kind === "fee") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    );
  }
  if (item.kind === "batch") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 11v6M19 14h6" />
      </svg>
    );
  }
  if (item.kind === "inventory") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function KpiCard({
  href,
  iconClass,
  icon,
  label,
  value,
  valueClass,
  badge,
  badgeClass,
  showChevron = false,
  className,
}: {
  href: string;
  iconClass: string;
  icon: ReactNode;
  label: string;
  value: string;
  valueClass?: string;
  badge?: string;
  badgeClass?: string;
  showChevron?: boolean;
  className?: string;
}) {
  return (
    <Link to={href} className={`ed-center-dash__kpi ${className ?? ""}`.trim()}>
      <div className="ed-center-dash__kpi-main">
        <span className={`ed-center-dash__kpi-icon ${iconClass}`}>{icon}</span>
        <div>
          <p className="ed-center-dash__kpi-label">{label}</p>
          <p className={`ed-center-dash__kpi-value ${valueClass ?? ""}`}>{value}</p>
        </div>
      </div>
      {badge ? <span className={`ed-center-dash__kpi-badge ${badgeClass ?? ""}`}>{badge}</span> : null}
      {showChevron ? <span className="ed-center-dash__kpi-chevron">{CHEVRON}</span> : null}
    </Link>
  );
}

function DashboardKpiRow({ data }: { data: CenterDashboardHome }) {
  const leadsBadge = data.leadsToday > 0 ? `+${data.leadsToday} today` : undefined;
  const batchesBadge = data.nextBatchTime ? `Next: ${data.nextBatchTime}` : undefined;
  const feesBadge =
    data.overdueInvoiceCount > 0
      ? `${data.overdueInvoiceCount} Overdue`
      : data.pendingFeesCents > 0
        ? "Pending"
        : undefined;

  return (
    <div className="ed-center-dash__kpis">
      <KpiCard
        href="/app/leads"
        iconClass="ed-center-dash__kpi-icon--leads"
        icon={<KpiIconLeads />}
        label="Open Leads"
        value={String(data.openLeads)}
        badge={leadsBadge}
        badgeClass="ed-center-dash__kpi-badge--leads"
        showChevron
        className="ed-center-dash__kpi--leads"
      />
      <div className="ed-center-dash__kpi-row">
        <KpiCard
          href="/app/batches"
          iconClass="ed-center-dash__kpi-icon--batches"
          icon={<KpiIconBatches />}
          label="Batches Today"
          value={String(data.batchesToday)}
          badge={batchesBadge}
          badgeClass="ed-center-dash__kpi-badge--batches"
        />
        <KpiCard
          href="/app/fees"
          iconClass="ed-center-dash__kpi-icon--fees"
          icon={<KpiIconFees />}
          label="Pending Fees"
          value={formatInrFromPaise(data.pendingFeesCents)}
          valueClass={data.pendingFeesCents > 0 ? "ed-center-dash__kpi-value--danger" : undefined}
          badge={feesBadge}
          badgeClass="ed-center-dash__kpi-badge--fees"
        />
      </div>
    </div>
  );
}

function BatchCard({ batch }: { batch: DashboardBatchCard }) {
  const badgeClass =
    batch.status === "live"
      ? "ed-center-dash__batch-badge ed-center-dash__batch-badge--live"
      : batch.status === "upcoming"
        ? "ed-center-dash__batch-badge ed-center-dash__batch-badge--upcoming"
        : "ed-center-dash__batch-badge";

  const progressTone = batch.accent === "purple" ? "ed-center-dash__batch-progress-value--purple" : "";
  const fillTone = batch.accent === "purple" ? "ed-center-dash__batch-progress-fill--purple" : "";

  return (
    <article className="ed-center-dash__batch-card">
      <div className={`ed-center-dash__batch-media ed-center-dash__batch-media--${batch.accent}`}>
        {batch.status !== "scheduled" ? <span className={badgeClass}>{batch.statusLabel}</span> : null}
      </div>
      <div className="ed-center-dash__batch-body">
        <div>
          <h3 className="ed-center-dash__batch-name">{batch.name}</h3>
          <p className="ed-center-dash__batch-meta">
            {PIN}
            <span>
              {batch.location} • {batch.timeRange}
            </span>
          </p>
        </div>
        <div>
          <div className="ed-center-dash__batch-progress-head">
            <span>
              {batch.enrolledStudents}/{batch.capacity} Students
            </span>
            <span className={`ed-center-dash__batch-progress-value ${progressTone}`}>
              {batch.progressPercent}% Progress
            </span>
          </div>
          <div className="ed-center-dash__batch-progress-bar" aria-hidden>
            <div
              className={`ed-center-dash__batch-progress-fill ${fillTone}`}
              style={{ width: `${batch.progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function BatchesSection({ batches }: { batches: DashboardBatchCard[] }) {
  const featured = batches.slice(0, 4);

  return (
    <section>
      <h2 className="ed-center-dash__section-title">Live &amp; Upcoming Batches</h2>
      {featured.length === 0 ? (
        <p className="ed-center-dash__empty">No active batches yet. Create one from Batches.</p>
      ) : (
        <div className="ed-center-dash__batch-grid" aria-label="Active batches">
          {featured.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActionItemsPanel({ items }: { items: DashboardActionItem[] }) {
  return (
    <aside>
      <div className="ed-center-dash__section-title-row">
        <h2 className="ed-center-dash__section-title">Action Items</h2>
        <span className="ed-center-dash__count-badge" aria-label={`${items.length} action items`}>
          {items.length}
        </span>
      </div>
      <div className="ed-center-dash__actions">
        {items.map((item) => (
          <Link key={item.id} to={item.href} className="ed-center-dash__action">
            <span className={`ed-center-dash__action-icon ed-center-dash__action-icon--${item.tone}`}>
              {actionIcon(item)}
            </span>
            <div className="ed-center-dash__action-text">
              <p className="ed-center-dash__action-title">{item.title}</p>
              <p className="ed-center-dash__action-subtitle">{item.subtitle}</p>
            </div>
            <span className="ed-center-dash__action-chevron">{CHEVRON}</span>
          </Link>
        ))}
      </div>
      <div className="ed-center-dash__updates">
        <p className="ed-center-dash__updates-label">System Updates</p>
        <p className="ed-center-dash__updates-status">
          <span className="ed-center-dash__updates-dot" aria-hidden />
          All servers operational
        </p>
      </div>
    </aside>
  );
}

export function CenterDashboardView({
  data,
  dateLabel,
}: {
  data: CenterDashboardHome;
  dateLabel: string;
}) {
  return (
    <div className="ed-center-dash">
      <header>
        <p className="ed-center-dash__date">{dateLabel}</p>
        <div className="ed-center-dash__title-row">
          <h1 className="ed-center-dash__title">Today&apos;s Schedule</h1>
          <Link to="/app/batches" className="ed-center-dash__link">
            View All
          </Link>
        </div>
      </header>

      <DashboardKpiRow data={data} />

      <div className="ed-center-dash__main">
        <BatchesSection batches={data.batches} />
        <ActionItemsPanel items={data.actionItems} />
      </div>

      <Link to="/app/leads" className="ed-center-dash__fab" aria-label="Add lead">
        +
      </Link>
    </div>
  );
}
