import { Badge, Card, DataList, KpiCard, KpiGrid, ListRow, PageTitle } from "@edunudg/ui";
import { formatInrFromPaise, useBrandMonitoringStats } from "@/hooks/useBrandMonitoringStats";
import { useBrandScope } from "./hooks/useBrandScope";

export function BrandAnalyticsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const stats = useBrandMonitoringStats(brandId);

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  const s = stats.data;

  return (
    <>
      <PageTitle>Analytics</PageTitle>
      <p className="ed-text-sm ed-muted">
        Live metrics from your franchise network — enrollments, centers, leads, and paid royalties. Nothing to
        enter manually; numbers update as your team works in EduNudg.
      </p>

      {stats.isLoading ? (
        <p className="ed-text-sm ed-muted">Loading analytics…</p>
      ) : (
        <>
          <KpiGrid>
            <KpiCard
              label="New enrollments (30d)"
              value={s?.enrollments30d ?? 0}
              hint={`${s?.enrollmentsActive ?? 0} active total`}
            />
            <KpiCard label="Students" value={s?.students ?? 0} />
            <KpiCard
              label="Centers"
              value={`${s?.centersActive ?? 0} / ${s?.centersTotal ?? 0}`}
              hint="Active / total"
            />
            <KpiCard label="Open student leads" value={s?.leadsOpen ?? 0} />
            <KpiCard
              label="Royalty collected (30d)"
              value={s != null ? formatInrFromPaise(s.revenue30dCents) : "—"}
              hint="Paid settlements in period"
            />
            <KpiCard
              label="Unpaid platform invoices"
              value={s != null ? formatInrFromPaise(s.unpaidAmountCents) : "—"}
              hint={s ? `${s.unpaidInvoices} open` : undefined}
            />
          </KpiGrid>

          <Card title="Daily enrollment trend (last 14 days)">
            {s && s.recentDaily.some((row) => row.enrollments_count > 0) ? (
              <div className="ed-monitoring-table-wrap">
                <table className="ed-monitoring-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>New enrollments</th>
                      <th>Royalty (paid)</th>
                      <th>Active centers</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.recentDaily.map((row) => (
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
              <p className="ed-text-sm ed-muted">
                No enrollments in the last two weeks yet. Converting leads and enrolling students will populate this
                chart automatically.
              </p>
            )}
          </Card>

          <Card title="Top centers (30d enrollments)">
            {s && s.topCenters.length > 0 ? (
              <DataList
                items={s.topCenters}
                render={(c) => (
                  <ListRow>
                    <div>
                      <strong>{c.name}</strong>
                      <div className="ed-text-sm ed-muted">{c.slug}</div>
                    </div>
                    <Badge tone="success">{c.enrollments30d} enrollments</Badge>
                  </ListRow>
                )}
              />
            ) : (
              <p className="ed-text-sm ed-muted">Center rankings appear once enrollments are recorded.</p>
            )}
          </Card>
        </>
      )}
    </>
  );
}
