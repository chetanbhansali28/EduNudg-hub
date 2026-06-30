import { useId, useState } from "react";
import { DataList, KpiCard, KpiGrid, ListRow } from "@edunudg/ui";
import type { BrandMonitoringStats } from "@/hooks/useBrandMonitoringStats";
import { formatInrFromPaise } from "@/hooks/useBrandMonitoringStats";
import "./brandDetailPage.css";

type SubscriptionSummary = {
  status: string;
  subscription_plans?: { name: string; code: string } | null;
} | null;

type Props = {
  loading: boolean;
  stats: BrandMonitoringStats | undefined;
  subscription: SubscriptionSummary;
};

export function BrandPerformanceCard({ loading, stats, subscription }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <section className={`ed-card ed-collapsible-card${open ? " is-open" : ""}`}>
      <div className="ed-card__header ed-collapsible-card__header">
        <button
          type="button"
          className="ed-collapsible-card__trigger"
          aria-label={open ? "Collapse performance section" : "Expand performance section"}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
        >
          <h2 className="ed-card__title">Performance (last 30 days)</h2>
          <span className="ed-collapsible-card__chevron" aria-hidden>
            ▾
          </span>
        </button>
      </div>

      {open ? (
        <div id={panelId} className="ed-collapsible-card__body">
          {loading ? (
            <p className="ed-text-sm ed-muted">Loading metrics…</p>
          ) : (
            <>
              <KpiGrid>
                <KpiCard
                  label="Royalty collected (30d)"
                  value={stats ? formatInrFromPaise(stats.revenue30dCents) : "—"}
                  hint="Paid settlements"
                />
                <KpiCard label="Enrollments (30d)" value={stats?.enrollments30d ?? 0} />
                <KpiCard
                  label="Active enrollments"
                  value={stats?.enrollmentsActive ?? 0}
                  hint={`${stats?.students ?? 0} students`}
                />
                <KpiCard
                  label="Centers"
                  value={`${stats?.centersActive ?? 0} / ${stats?.centersTotal ?? 0}`}
                  hint="Active / total"
                />
                <KpiCard label="Open leads" value={stats?.leadsOpen ?? 0} />
                <KpiCard
                  label="Unpaid invoices"
                  value={stats ? formatInrFromPaise(stats.unpaidAmountCents) : "—"}
                  hint={stats ? `${stats.unpaidInvoices} open` : undefined}
                />
                <KpiCard
                  label="Subscription"
                  value={subscription?.subscription_plans?.name ?? "—"}
                  hint={subscription?.status}
                />
              </KpiGrid>

              {stats && stats.recentDaily.some((row) => row.enrollments_count > 0 || row.revenue_cents > 0) ? (
                <div className="ed-monitoring-table-wrap">
                  <p className="ed-text-sm ed-muted" style={{ marginBottom: "0.5rem" }}>
                    Daily trend (computed from enrollments &amp; royalties)
                  </p>
                  <table className="ed-monitoring-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Enrollments</th>
                        <th>Royalty (paid)</th>
                        <th>Active centers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentDaily.map((row) => (
                        <tr key={row.metric_date}>
                          <td>{row.metric_date}</td>
                          <td>{row.enrollments_count}</td>
                          <td>{formatInrFromPaise(row.revenue_cents)}</td>
                          <td>{row.active_centers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="ed-text-sm ed-muted">No enrollments or royalty payments in the last two weeks yet.</p>
              )}

              {stats && stats.topCenters.length > 0 && (
                <div style={{ marginTop: "1.25rem" }}>
                  <p className="ed-text-sm ed-muted" style={{ marginBottom: "0.5rem" }}>
                    Top centers by enrollments (30d)
                  </p>
                  <DataList
                    items={stats.topCenters.map((c) => ({ ...c, id: c.id }))}
                    render={(c) => (
                      <ListRow>
                        <span>
                          <strong>{c.name}</strong>
                          <span className="ed-text-sm ed-muted"> · {c.slug}</span>
                        </span>
                        <span className="ed-text-sm">
                          {c.enrollments30d} enrollments · {formatInrFromPaise(c.fees30dCents)} fees
                        </span>
                      </ListRow>
                    )}
                  />
                </div>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
