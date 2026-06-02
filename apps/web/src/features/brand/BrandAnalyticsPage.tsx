import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  DataList,
  Input,
  KpiCard,
  KpiGrid,
  ListRow,
  MutationError,
  PageTitle,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "@/features/platform/components/CrudRowActions";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { useBrandScope } from "./hooks/useBrandScope";

interface DailyMetric {
  id: string;
  metric_date: string;
  enrollments_count: number;
  revenue_cents: number;
  active_centers: number;
}

const emptyMetric = {
  metric_date: "",
  enrollments_count: "",
  revenue_inr: "",
  active_centers: "",
};

export function BrandAnalyticsPage() {
  const { brandId, missingBrand } = useBrandScope();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [form, setForm] = useState(emptyMetric);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyMetric);

  const metrics = useQuery({
    queryKey: ["analytics-daily-brand", brandId],
    enabled: !!brandId,
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("analytics_daily_brand")
        .select("id, metric_date, enrollments_count, revenue_cents, active_centers")
        .eq("brand_id", brandId!)
        .order("metric_date", { ascending: false })
        .limit(30);
      return supabaseList(data, qErr) as DailyMetric[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["analytics-daily-brand", brandId] });

  const rows = metrics.data ?? [];
  const summary = {
    enrollments: rows.reduce((s, r) => s + (r.enrollments_count ?? 0), 0),
    revenue: rows.reduce((s, r) => s + (r.revenue_cents ?? 0), 0),
    latestCenters: rows[0]?.active_centers ?? 0,
  };

  const toPayload = (f: typeof emptyMetric) => {
    const revenue = Math.round(parseFloat(f.revenue_inr || "0") * 100);
    return {
      metric_date: f.metric_date,
      enrollments_count: parseInt(f.enrollments_count || "0", 10),
      revenue_cents: Number.isNaN(revenue) ? 0 : revenue,
      active_centers: parseInt(f.active_centers || "0", 10),
    };
  };

  const createMetric = useMutation({
    mutationFn: async () => {
      if (!brandId) throw new Error("Brand required");
      clear();
      const { error: mErr } = await getSupabase().from("analytics_daily_brand").insert({
        brand_id: brandId,
        ...toPayload(form),
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setForm(emptyMetric);
    },
    onError: capture,
  });

  const updateMetric = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("analytics_daily_brand")
        .update(toPayload(editForm))
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidate();
      setEditingId(null);
    },
    onError: capture,
  });

  const deleteMetric = useMutation({
    mutationFn: async (id: string) => {
      if (!confirm("Delete this daily metric?")) return;
      clear();
      const { error: mErr } = await getSupabase().from("analytics_daily_brand").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidate,
    onError: capture,
  });

  if (missingBrand) {
    return <p className="ed-empty">Brand context not found.</p>;
  }

  return (
    <>
      <PageTitle>Analytics</PageTitle>
      <MutationError message={error} />

      <KpiGrid>
        <KpiCard label="Enrollments (recent rows)" value={rows.length ? summary.enrollments : "—"} />
        <KpiCard
          label="Revenue (recent rows)"
          value={rows.length ? `₹${(summary.revenue / 100).toLocaleString()}` : "—"}
        />
        <KpiCard label="Active centers (latest day)" value={rows.length ? summary.latestCenters : "—"} />
      </KpiGrid>

      <Card title="Add daily snapshot">
        <Input label="Date" value={form.metric_date} onChange={(v) => setForm((f) => ({ ...f, metric_date: v }))} placeholder="YYYY-MM-DD" />
        <Input label="Enrollments" value={form.enrollments_count} onChange={(v) => setForm((f) => ({ ...f, enrollments_count: v }))} />
        <Input label="Revenue (INR)" value={form.revenue_inr} onChange={(v) => setForm((f) => ({ ...f, revenue_inr: v }))} />
        <Input label="Active centers" value={form.active_centers} onChange={(v) => setForm((f) => ({ ...f, active_centers: v }))} />
        <Button onClick={() => createMetric.mutate()} disabled={!form.metric_date || createMetric.isPending}>
          Add snapshot
        </Button>
      </Card>

      <Card title="Daily metrics">
        <DataList
          items={metrics.data ?? []}
          empty="No metrics recorded."
          render={(m) => {
            const editing = editingId === m.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      setEditingId(m.id);
                      setEditForm({
                        metric_date: m.metric_date,
                        enrollments_count: String(m.enrollments_count),
                        revenue_inr: String(m.revenue_cents / 100),
                        active_centers: String(m.active_centers),
                      });
                    }}
                    onSave={() => updateMetric.mutate(m.id)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteMetric.mutate(m.id)}
                    saveDisabled={updateMetric.isPending}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Input label="Date" value={editForm.metric_date} onChange={(v) => setEditForm((f) => ({ ...f, metric_date: v }))} />
                    <Input label="Enrollments" value={editForm.enrollments_count} onChange={(v) => setEditForm((f) => ({ ...f, enrollments_count: v }))} />
                    <Input label="Revenue (INR)" value={editForm.revenue_inr} onChange={(v) => setEditForm((f) => ({ ...f, revenue_inr: v }))} />
                    <Input label="Active centers" value={editForm.active_centers} onChange={(v) => setEditForm((f) => ({ ...f, active_centers: v }))} />
                  </div>
                ) : (
                  <span>
                    {m.metric_date}: {m.enrollments_count} enrollments · ₹{(m.revenue_cents / 100).toLocaleString()} ·{" "}
                    {m.active_centers} centers
                  </span>
                )}
              </ListRow>
            );
          }}
        />
      </Card>
    </>
  );
}
