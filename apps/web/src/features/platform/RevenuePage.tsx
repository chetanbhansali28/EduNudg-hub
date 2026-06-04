import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  DataList,
  Input,
  KpiCard,
  KpiGrid,
  ListRow,
  MutationError,
  PageTitle,
  Select,
} from "@edunudg/ui";
import { getSupabase } from "@/lib/supabase";
import { supabaseList } from "@/lib/supabaseResult";
import { CrudRowActions } from "./components/CrudRowActions";
import { useMutationError } from "./hooks/useMutationError";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { useAddFormCloser } from "@/features/shared/useAddFormCloser";

type InvoiceStatus = "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";

interface Invoice {
  id: string;
  brand_id: string;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  brands?: { name: string } | null;
}

interface BrandMetric {
  id: string;
  brand_id: string;
  metric_date: string;
  enrollments_count: number;
  revenue_cents: number;
  active_centers: number;
  brands?: { name: string } | null;
}

interface BrandOption {
  id: string;
  name: string;
}

const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const emptyInvoice = { brand_id: "", amount_cents: "", status: "draft" as InvoiceStatus };
const emptyMetric = { brand_id: "", metric_date: "", enrollments_count: "0", revenue_cents: "0", active_centers: "0" };

export function RevenuePage() {
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [editInvoice, setEditInvoice] = useState(emptyInvoice);

  const [metricForm, setMetricForm] = useState(emptyMetric);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [editMetric, setEditMetric] = useState(emptyMetric);
  const invoiceCloser = useAddFormCloser();
  const metricCloser = useAddFormCloser();

  const brands = useQuery({
    queryKey: ["brands-options"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("brands")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      return supabaseList(data, qErr) as BrandOption[];
    },
  });

  const invoices = useQuery({
    queryKey: ["platform-invoices"],
    queryFn: async () => {
      const { data, error: qErr } = await getSupabase()
        .from("platform_invoices")
        .select("*, brands(name)")
        .order("created_at", { ascending: false });
      return supabaseList(data, qErr) as Invoice[];
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

  const brandOptions = (brands.data ?? []).map((b) => ({ value: b.id, label: b.name }));

  const totalRevenue = (metrics.data ?? []).reduce((sum, m) => sum + (m.revenue_cents ?? 0), 0);
  const totalEnrollments = (metrics.data ?? []).reduce((sum, m) => sum + (m.enrollments_count ?? 0), 0);

  const invalidateInvoices = () => qc.invalidateQueries({ queryKey: ["platform-invoices"] });
  const invalidateMetrics = () => qc.invalidateQueries({ queryKey: ["analytics-daily-brand"] });

  const createInvoice = useMutation({
    mutationFn: async () => {
      clear();
      const { error: mErr } = await getSupabase().from("platform_invoices").insert({
        brand_id: invoiceForm.brand_id,
        amount_cents: Number(invoiceForm.amount_cents) || 0,
        status: invoiceForm.status,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateInvoices();
      setInvoiceForm(emptyInvoice);
      invoiceCloser.closeAddForm();
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
          amount_cents: Number(editInvoice.amount_cents) || 0,
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
      if (!confirm("Delete this invoice?")) return;
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
        revenue_cents: Number(metricForm.revenue_cents) || 0,
        active_centers: Number(metricForm.active_centers) || 0,
      });
      if (mErr) throw mErr;
    },
    onSuccess: () => {
      invalidateMetrics();
      setMetricForm(emptyMetric);
      metricCloser.closeAddForm();
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
          revenue_cents: Number(editMetric.revenue_cents) || 0,
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
      if (!confirm("Delete this rollup row?")) return;
      const { error: mErr } = await getSupabase().from("analytics_daily_brand").delete().eq("id", id);
      if (mErr) throw mErr;
    },
    onSuccess: invalidateMetrics,
    onError: capture,
  });

  const formatCents = (cents: number) => `₹${(cents / 100).toLocaleString()}`;

  return (
    <>
      <PageTitle>Revenue & Usage</PageTitle>
      <MutationError message={error} />
      <KpiGrid>
        <KpiCard label="Rollup revenue (sample)" value={formatCents(totalRevenue)} hint="From daily brand metrics" />
        <KpiCard label="Rollup enrollments" value={totalEnrollments} />
        <KpiCard label="Invoices" value={invoices.data?.length ?? 0} />
      </KpiGrid>

      <AddFormSection buttonLabel="Create invoice" panelTitle="Create invoice">
        {({ close }) => {
          invoiceCloser.bindClose(close);
          return (
            <>
              <Select
                label="Brand"
                value={invoiceForm.brand_id}
                onChange={(v) => setInvoiceForm((f) => ({ ...f, brand_id: v }))}
                options={brandOptions}
                placeholder="Select brand"
              />
              <Input
                label="Amount (paise)"
                value={invoiceForm.amount_cents}
                onChange={(v) => setInvoiceForm((f) => ({ ...f, amount_cents: v }))}
                type="number"
              />
              <Select
                label="Status"
                value={invoiceForm.status}
                onChange={(v) => setInvoiceForm((f) => ({ ...f, status: v }))}
                options={INVOICE_STATUS_OPTIONS}
              />
              <Button
                onClick={() => createInvoice.mutate()}
                disabled={!invoiceForm.brand_id || createInvoice.isPending}
              >
                Create invoice
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <Card title="Platform invoices">
        <DataList
          items={invoices.data ?? []}
          empty="No invoices yet."
          render={(inv) => {
            const editing = editingInvoiceId === inv.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      clear();
                      setEditingInvoiceId(inv.id);
                      setEditInvoice({
                        brand_id: inv.brand_id,
                        amount_cents: String(inv.amount_cents),
                        status: inv.status,
                      });
                    }}
                    onSave={() => updateInvoice.mutate(inv.id)}
                    onCancel={() => setEditingInvoiceId(null)}
                    onDelete={() => deleteInvoice.mutate(inv.id)}
                    saveDisabled={!editInvoice.brand_id}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Select
                      label="Brand"
                      value={editInvoice.brand_id}
                      onChange={(v) => setEditInvoice((f) => ({ ...f, brand_id: v }))}
                      options={brandOptions}
                    />
                    <Input
                      label="Amount (paise)"
                      value={editInvoice.amount_cents}
                      onChange={(v) => setEditInvoice((f) => ({ ...f, amount_cents: v }))}
                      type="number"
                    />
                    <Select
                      label="Status"
                      value={editInvoice.status}
                      onChange={(v) => setEditInvoice((f) => ({ ...f, status: v }))}
                      options={INVOICE_STATUS_OPTIONS}
                    />
                  </div>
                ) : (
                  <span>
                    {inv.brands?.name ?? "Brand"} — {formatCents(inv.amount_cents)}{" "}
                    <Badge tone={inv.status === "paid" ? "success" : "default"}>{inv.status}</Badge>
                  </span>
                )}
              </ListRow>
            );
          }}
        />
      </Card>

      <AddFormSection buttonLabel="Add daily brand metric" panelTitle="Add daily brand metric">
        {({ close }) => {
          metricCloser.bindClose(close);
          return (
            <>
              <Select
                label="Brand"
                value={metricForm.brand_id}
                onChange={(v) => setMetricForm((f) => ({ ...f, brand_id: v }))}
                options={brandOptions}
                placeholder="Select brand"
              />
              <Input
                label="Date (YYYY-MM-DD)"
                value={metricForm.metric_date}
                onChange={(v) => setMetricForm((f) => ({ ...f, metric_date: v }))}
                placeholder="2026-06-01"
              />
              <Input
                label="Enrollments"
                value={metricForm.enrollments_count}
                onChange={(v) => setMetricForm((f) => ({ ...f, enrollments_count: v }))}
                type="number"
              />
              <Input
                label="Revenue (paise)"
                value={metricForm.revenue_cents}
                onChange={(v) => setMetricForm((f) => ({ ...f, revenue_cents: v }))}
                type="number"
              />
              <Input
                label="Active centers"
                value={metricForm.active_centers}
                onChange={(v) => setMetricForm((f) => ({ ...f, active_centers: v }))}
                type="number"
              />
              <Button
                onClick={() => createMetric.mutate()}
                disabled={!metricForm.brand_id || !metricForm.metric_date || createMetric.isPending}
              >
                Add metric
              </Button>
            </>
          );
        }}
      </AddFormSection>

      <Card title="Daily brand rollups">
        <DataList
          items={metrics.data ?? []}
          empty="No rollup data."
          render={(m) => {
            const editing = editingMetricId === m.id;
            return (
              <ListRow
                aside={
                  <CrudRowActions
                    editing={editing}
                    onEdit={() => {
                      clear();
                      setEditingMetricId(m.id);
                      setEditMetric({
                        brand_id: m.brand_id,
                        metric_date: m.metric_date,
                        enrollments_count: String(m.enrollments_count),
                        revenue_cents: String(m.revenue_cents),
                        active_centers: String(m.active_centers),
                      });
                    }}
                    onSave={() => updateMetric.mutate(m.id)}
                    onCancel={() => setEditingMetricId(null)}
                    onDelete={() => deleteMetric.mutate(m.id)}
                    saveDisabled={!editMetric.brand_id || !editMetric.metric_date}
                  />
                }
              >
                {editing ? (
                  <div className="ed-form-section">
                    <Select
                      label="Brand"
                      value={editMetric.brand_id}
                      onChange={(v) => setEditMetric((f) => ({ ...f, brand_id: v }))}
                      options={brandOptions}
                    />
                    <Input
                      label="Date"
                      value={editMetric.metric_date}
                      onChange={(v) => setEditMetric((f) => ({ ...f, metric_date: v }))}
                    />
                    <Input
                      label="Enrollments"
                      value={editMetric.enrollments_count}
                      onChange={(v) => setEditMetric((f) => ({ ...f, enrollments_count: v }))}
                      type="number"
                    />
                    <Input
                      label="Revenue (paise)"
                      value={editMetric.revenue_cents}
                      onChange={(v) => setEditMetric((f) => ({ ...f, revenue_cents: v }))}
                      type="number"
                    />
                    <Input
                      label="Active centers"
                      value={editMetric.active_centers}
                      onChange={(v) => setEditMetric((f) => ({ ...f, active_centers: v }))}
                      type="number"
                    />
                  </div>
                ) : (
                  <span>
                    {m.brands?.name ?? "Brand"} · {m.metric_date} — {formatCents(m.revenue_cents)}, {m.enrollments_count}{" "}
                    enrollments
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
