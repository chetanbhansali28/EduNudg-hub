import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, DataList, KpiCard, KpiGrid, ListRow, PageTitle } from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList, supabaseMaybe } from "@/lib/supabaseResult";
import { isLeadStale } from "@/lib/leadSla";
import type { LeadRow } from "@/lib/leadsApi";
import { centerPortalUrl } from "@/lib/brandPortalUrl";
import { useBrandScope } from "./hooks/useBrandScope";

interface CenterRow {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  status: string;
  city: string | null;
  pincode: string | null;
  address_line1: string | null;
  contact_phone: string | null;
  short_description: string | null;
}

export function BrandCenterDetailPage() {
  const { centerSlug = "" } = useParams<{ centerSlug: string }>();
  const { brandId, brandSlug, missingBrand } = useBrandScope();

  const center = useQuery({
    queryKey: ["brand-center-detail", brandId, centerSlug],
    enabled: !!brandId && !!centerSlug,
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("franchise_centers")
        .select(
          "id, slug, name, display_name, status, city, pincode, address_line1, contact_phone, short_description"
        )
        .eq("brand_id", brandId!)
        .eq("slug", centerSlug)
        .is("deleted_at", null)
        .maybeSingle();
      return supabaseMaybe(data, error) as CenterRow | null;
    },
  });

  const centerId = center.data?.id;

  const stats = useQuery({
    queryKey: ["brand-center-stats", centerId],
    enabled: !!centerId,
    queryFn: async () => {
      const sb = getSupabase();
      const [openLeads, allLeads, enrollments] = await Promise.all([
        sb
          .from("leads")
          .select("id", { count: "exact", head: true })
          .eq("center_id", centerId!)
          .in("status", ["new", "contacted", "qualified"]),
        sb
          .from("leads")
          .select(
            "id, parent_name, full_name, status, city, pincode, assigned_at, stale_at, last_center_action_at, center_id, created_at"
          )
          .eq("center_id", centerId!)
          .order("created_at", { ascending: false })
          .limit(20),
        sb
          .from("student_enrollments")
          .select("id, student_id", { count: "exact" })
          .eq("center_id", centerId!)
          .eq("status", "active"),
      ]);

      const leadRows = supabaseList(allLeads.data, allLeads.error) as LeadRow[];
      const enrollmentRows = enrollments.data ?? [];
      const uniqueStudents = new Set(enrollmentRows.map((r) => r.student_id as string)).size;
      const now = Date.now();
      const staleCount = leadRows.filter((l) => isLeadStale(l, now)).length;

      return {
        openLeads: openLeads.count ?? 0,
        staleLeads: staleCount,
        students: uniqueStudents,
        activeEnrollments: enrollments.count ?? enrollmentRows.length,
        recentLeads: leadRows,
      };
    },
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  if (center.isLoading) {
    return <p className="ed-text-sm ed-muted">Loading center…</p>;
  }

  if (!center.data) {
    return (
      <div className="ed-detail-page">
        <PageTitle>Center not found</PageTitle>
        <div className="ed-detail-page__toolbar">
          <Link to="/app/centers">
            <Button variant="ghost">Back to centers</Button>
          </Link>
        </div>
      </div>
    );
  }

  const c = center.data;
  const s = stats.data;
  const portalUrl = brandSlug ? centerPortalUrl(brandSlug, c.slug) : null;

  return (
    <div className="ed-detail-page">
      <PageTitle>{c.display_name ?? c.name}</PageTitle>
      <p className="ed-detail-page__subtitle">
        Read-only 360° view · {c.slug}
        {c.city ? ` · ${c.city}` : ""}{" "}
        <Badge tone={c.status === "active" ? "success" : "default"}>{c.status}</Badge>
      </p>

      <div className="ed-detail-page__toolbar">
        <Link to="/app/centers">
          <Button variant="ghost">← All centers</Button>
        </Link>
        {portalUrl && (
          <Button variant="ghost" onClick={() => window.open(portalUrl, "_blank", "noopener,noreferrer")}>
            Open center site
          </Button>
        )}
      </div>

      <KpiGrid>
        <KpiCard label="Open leads" value={s?.openLeads ?? "—"} />
        <KpiCard label="Needs attention (SLA)" value={s?.staleLeads ?? "—"} />
        <KpiCard label="Students enrolled" value={s?.students ?? "—"} />
        <KpiCard label="Active enrollments" value={s?.activeEnrollments ?? "—"} />
      </KpiGrid>

      <Card title="Center profile">
        {c.short_description && <p className="ed-text-sm">{c.short_description}</p>}
        {c.address_line1 && <p className="ed-text-sm ed-muted">{c.address_line1}</p>}
        {c.pincode && <p className="ed-text-sm ed-muted">Pincode: {c.pincode}</p>}
        {c.contact_phone && <p className="ed-text-sm ed-muted">Contact: {c.contact_phone}</p>}
        {!c.pincode && (
          <p className="ed-text-sm ed-muted">
            Pincode missing — this center is excluded from pincode suggestions until location is complete.
          </p>
        )}
      </Card>

      <Card title="Recent leads (read-only)">
        <DataList
          items={s?.recentLeads ?? []}
          empty="No leads for this center yet."
          render={(l) => (
            <ListRow>
              <div>
                <strong>{l.parent_name ?? l.full_name}</strong>
                <div className="ed-text-sm ed-muted">
                  {l.city} {l.pincode} · <Badge>{l.status}</Badge>
                </div>
              </div>
            </ListRow>
          )}
        />
      </Card>
    </div>
  );
}
