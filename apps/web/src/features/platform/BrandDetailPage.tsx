import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, KpiCard, KpiGrid, ListRow, PageToolbar } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { brandAdminPath, isUuid } from "@/lib/adminPaths";
import { portalTargetFromDomain } from "@/lib/brandPortalUrl";
import { supabaseList, supabaseMaybe } from "@/lib/supabaseResult";
import { formatInrFromPaise, useBrandMonitoringStats } from "@/hooks/useBrandMonitoringStats";
import { BrandEditForm } from "./BrandEditForm";
import { BrandFeatureTogglesCard } from "./BrandFeatureTogglesCard";
import { PortalOpenButton } from "./PortalOpenButton";

interface BrandRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  logo_url: string | null;
  marketing_theme: string;
  created_at: string;
  updated_at: string;
}

interface CenterRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  city: string | null;
}

interface DomainRow {
  hostname: string;
  portal_type: string;
  is_primary: boolean;
}

export function BrandDetailPage() {
  const { brandSlug: brandSlugParam } = useParams<{ brandSlug: string }>();
  const brandSlug = brandSlugParam?.trim() ?? "";
  const lookupById = isUuid(brandSlug);
  const qc = useQueryClient();

  const brand = useQuery({
    queryKey: ["brand", lookupById ? "id" : "slug", brandSlug],
    enabled: !!brandSlug,
    queryFn: async () => {
      const q = getSupabase()
        .from("brands")
        .select("id, slug, name, status, logo_url, marketing_theme, created_at, updated_at")
        .is("deleted_at", null);
      const { data, error } = lookupById
        ? await q.eq("id", brandSlug).maybeSingle()
        : await q.eq("slug", brandSlug).maybeSingle();
      return supabaseMaybe(data, error) as BrandRow | null;
    },
  });

  const brandId = brand.data?.id;
  const monitoring = useBrandMonitoringStats(brandId);

  const centers = useQuery({
    queryKey: ["brand-centers", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("franchise_centers")
        .select("id, slug, name, status, city")
        .eq("brand_id", brandId!)
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, error) as CenterRow[];
    },
  });

  const domains = useQuery({
    queryKey: ["brand-domains", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("domain_mappings")
        .select("hostname, portal_type, is_primary")
        .eq("brand_id", brandId!)
        .order("is_primary", { ascending: false });
      return supabaseList(data, error) as DomainRow[];
    },
  });

  const subscription = useQuery({
    queryKey: ["brand-subscription", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("brand_subscriptions")
        .select("status, subscription_plans(name, code)")
        .eq("brand_id", brandId!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return supabaseMaybe(data, error);
    },
  });

  const brandSettings = useQuery({
    queryKey: ["brand-settings", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("brand_settings")
        .select("id, settings")
        .eq("brand_id", brandId!)
        .maybeSingle();
      return supabaseMaybe(data, error) as { id: string; settings: Record<string, unknown> } | null;
    },
  });

  useEffect(() => {
    if (brand.data?.name) {
      document.title = `${brand.data.name} · Brands · EduNudg Admin`;
    }
    return () => {
      document.title = "EduNudg";
    };
  }, [brand.data?.name]);

  if (brand.isLoading) return <p className="ed-empty">Loading brand…</p>;

  if (brand.data && lookupById && brand.data.slug !== brandSlug) {
    return <Navigate to={brandAdminPath(brand.data.slug)} replace />;
  }

  if (!brand.data) {
    return (
      <>
        <PageToolbar title="Brand not found">
          <Link to="/admin/brands">
            <Button variant="ghost">Back to brands</Button>
          </Link>
        </PageToolbar>
        <p className="ed-empty">This brand does not exist or you do not have access.</p>
      </>
    );
  }

  const b = brand.data;
  const stats = monitoring.data;
  const primaryBrandHost =
    domains.data?.find((d) => d.portal_type === "brand" && d.is_primary)?.hostname ??
    domains.data?.find((d) => d.portal_type === "brand")?.hostname;
  const brandBackendTarget = portalTargetFromDomain("brand", primaryBrandHost ?? `${b.slug}.localhost`, b.slug);

  const sub = subscription.data as
    | { status: string; subscription_plans?: { name: string; code: string } | null }
    | null
    | undefined;

  return (
    <>
      <PageToolbar
        title={
          <h2 className="ed-page-title ed-page-title--with-sub ed-brand-detail__title">
            {b.logo_url ? <img src={b.logo_url} alt="" className="ed-brand-detail__logo" /> : null}
            <span>{b.name}</span>
          </h2>
        }
        subtitle={
          <>
            <span className="ed-muted">{b.slug}</span> ·{" "}
            <Badge tone={b.status === "active" ? "success" : b.status === "suspended" ? "warning" : "default"}>
              {b.status}
            </Badge>
          </>
        }
      >
        <Link to="/admin/brands">
          <Button variant="ghost">All brands</Button>
        </Link>
        {brandBackendTarget ? <PortalOpenButton target={brandBackendTarget} label="Open brand backend" /> : null}
      </PageToolbar>

      <Card title="Performance (last 30 days)">
        {monitoring.isLoading ? (
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
              <KpiCard label="Subscription" value={sub?.subscription_plans?.name ?? "—"} hint={sub?.status} />
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
      </Card>

      <Card title="Brand settings">
        <BrandEditForm
          brandId={b.id}
          name={b.name}
          status={b.status as "draft" | "active" | "suspended" | "archived"}
          logoUrl={b.logo_url}
        />
      </Card>

      {brandId && !brandSettings.isLoading && (
        <BrandFeatureTogglesCard
          brandId={brandId}
          settingsId={brandSettings.data?.id ?? null}
          settings={brandSettings.data?.settings ?? {}}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ["brand-settings", brandId] });
            void qc.invalidateQueries({ queryKey: ["brand-features", brandId] });
          }}
        />
      )}

      <Card title="Domains">
        <DataList
          items={(domains.data ?? []).map((d, i) => ({ ...d, id: `${d.hostname}-${i}` }))}
          empty="No domain mappings for this brand."
          render={(d) => {
            const target = portalTargetFromDomain(d.portal_type, d.hostname, b.slug);
            return (
              <ListRow aside={target ? <PortalOpenButton target={target} /> : undefined}>
                <span>
                  {d.hostname} — {d.portal_type}
                  {d.is_primary ? " (primary)" : ""}
                </span>
              </ListRow>
            );
          }}
        />
      </Card>

      <Card title="Franchise centers">
        <DataList
          items={centers.data ?? []}
          empty="No centers yet."
          render={(c) => {
            const centerHost =
              domains.data?.find(
                (d) => d.portal_type === "center" && d.hostname.toLowerCase().startsWith(`${c.slug}.`)
              )?.hostname ?? `${c.slug}.${b.slug}.localhost`;
            const target = portalTargetFromDomain("center", centerHost, b.slug);
            return (
              <ListRow aside={target ? <PortalOpenButton target={target} label="Open center" /> : undefined}>
                <div>
                  <strong>{c.name}</strong>
                  <div className="ed-text-sm ed-muted">
                    {c.slug}
                    {c.city ? ` · ${c.city}` : ""}
                  </div>
                  <Badge tone={c.status === "active" ? "success" : "default"}>{c.status}</Badge>
                </div>
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
