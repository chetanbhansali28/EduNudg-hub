import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { paiseToRupeesInput, rupeesToPaise } from "@/lib/inrCurrency";
import { useMutationError } from "./hooks/useMutationError";
import {
  RevenuePageView,
  type BrandMetric,
  type InvoiceStatus,
  type PlatformInvoice,
} from "./RevenuePageView";

const emptyInvoice = { brand_id: "", amount_rupees: "", status: "draft" as InvoiceStatus };
const emptyMetric = {
  brand_id: "",
  metric_date: "",
  enrollments_count: "0",
  revenue_rupees: "0",
  active_centers: "0",
};

export function RevenuePage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editInvoice, setEditInvoice] = useState(emptyInvoice);

  const [metricForm, setMetricForm] = useState(emptyMetric);
  const [createMetricOpen, setCreateMetricOpen] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editMetric, setEditMetric] = useState(emptyMetric);

  const brands = useQuery({
    queryKey: ["brands-options"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as { id: string; name: string }[];
    },
  });

  const subscriptions = useQuery({
    queryKey: ["brand-subscriptions-count"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brand_subscriptions")
        .select("id, status")
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as { id: string; status: string }[];
    },
  });

  const invoices = useQuery({
    queryKey: ["platform-invoices"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_invoices")
        .select("*, brands(name)")
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as PlatformInvoice[];
    },
  });

  const metrics = useQuery({
    queryKey: ["analytics-daily-brand"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("analytics_daily_brand")
        .select("*, brands(name)")
        .order("metric_date", { ascending: false })
        .limit(50);
      return supabaseList(data, qErr) as BrandMetric[];
    },
  });

  const brandOptions = (brands.data ?? []).map((brand) => ({ value: brand.id, label: brand.name }));
  const activeSubscriptions = (subscriptions.data ?? []).filter((sub) => sub.status === "active").length;
  const brandCount = brands.data?.length ?? 0;

  const invalidateInvoices = () => qc.invalidateQueries({ queryKey: ["platform-invoices"] });
  const invalidateMetrics = () => qc.invalidateQueries({ queryKey: ["analytics-daily-brand"] });

  const createInvoice = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("platform_invoices").insert({
        brand_id: invoiceForm.brand_id,
        amount_cents: rupeesToPaise(invoiceForm.amount_rupees),
        status: invoiceForm.status,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateInvoices();
      setInvoiceForm(emptyInvoice);
      setCreateInvoiceOpen(false);
    },
    onError: capture,
  });

  const updateInvoice = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("platform_invoices")
        .update({
          brand_id: editInvoice.brand_id,
          amount_cents: rupeesToPaise(editInvoice.amount_rupees),
          status: editInvoice.status,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateInvoices();
      setEditingInvoiceId(null);
    },
    onError: capture,
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("platform_invoices").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateInvoices,
    onError: capture,
  });

  const createMetric = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("analytics_daily_brand").insert({
        brand_id: metricForm.brand_id,
        metric_date: metricForm.metric_date,
        enrollments_count: Number(metricForm.enrollments_count) || 0,
        revenue_cents: rupeesToPaise(metricForm.revenue_rupees),
        active_centers: Number(metricForm.active_centers) || 0,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateMetrics();
      setMetricForm(emptyMetric);
      setCreateMetricOpen(false);
    },
    onError: capture,
  });

  const updateMetric = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase()
        .from("analytics_daily_brand")
        .update({
          brand_id: editMetric.brand_id,
          metric_date: editMetric.metric_date,
          enrollments_count: Number(editMetric.enrollments_count) || 0,
          revenue_cents: rupeesToPaise(editMetric.revenue_rupees),
          active_centers: Number(editMetric.active_centers) || 0,
        })
        .eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateMetrics();
      setEditingMetricId(null);
    },
    onError: capture,
  });

  const deleteMetric = useMutation({
    mutationFn: async (id: string) => {
      clear();
      const { error: mErr } = await getSupabase().from("analytics_daily_brand").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateMetrics,
    onError: capture,
  });

  return (
    <RevenuePageView
      invoices={invoices.data ?? []}
      metrics={metrics.data ?? []}
      brandOptions={brandOptions}
      activeSubscriptions={activeSubscriptions}
      brandCount={brandCount}
      error={error}
      invoiceForm={invoiceForm}
      onInvoiceFormChange={setInvoiceForm}
      onCreateInvoice={() => createInvoice.mutate()}
      createInvoicePending={createInvoice.isPending}
      createInvoiceOpen={createInvoiceOpen}
      onCreateInvoiceOpenChange={setCreateInvoiceOpen}
      editingInvoiceId={editingInvoiceId}
      editInvoice={editInvoice}
      onEditInvoice={(invoice) => {
        clear();
        setEditingInvoiceId(invoice.id);
        setEditInvoice({
          brand_id: invoice.brand_id,
          amount_rupees: paiseToRupeesInput(invoice.amount_cents),
          status: invoice.status,
        });
      }}
      onEditInvoiceChange={setEditInvoice}
      onCancelInvoiceEdit={() => setEditingInvoiceId(null)}
      onSaveInvoice={() => {
        if (editingInvoiceId) updateInvoice.mutate(editingInvoiceId);
      }}
      onDeleteInvoice={(invoiceId) => deleteInvoice.mutate(invoiceId)}
      deleteInvoicePending={deleteInvoice.isPending}
      metricForm={metricForm}
      onMetricFormChange={setMetricForm}
      onCreateMetric={() => createMetric.mutate()}
      createMetricPending={createMetric.isPending}
      createMetricOpen={createMetricOpen}
      onCreateMetricOpenChange={setCreateMetricOpen}
      editingMetricId={editingMetricId}
      editMetric={editMetric}
      onEditMetric={(metric) => {
        clear();
        setEditingMetricId(metric.id);
        setEditMetric({
          brand_id: metric.brand_id,
          metric_date: metric.metric_date,
          enrollments_count: String(metric.enrollments_count),
          revenue_rupees: paiseToRupeesInput(metric.revenue_cents),
          active_centers: String(metric.active_centers),
        });
      }}
      onEditMetricChange={setEditMetric}
      onCancelMetricEdit={() => setEditingMetricId(null)}
      onSaveMetric={() => {
        if (editingMetricId) updateMetric.mutate(editingMetricId);
      }}
      onDeleteMetric={(metricId) => deleteMetric.mutate(metricId)}
      deleteMetricPending={deleteMetric.isPending}
    />
  );
}
