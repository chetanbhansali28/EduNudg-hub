import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  CatalogFormPanel,
  DataList,
  FilterTabs,
  FormGrid,
  Input,
  LeadKpiCard,
  LeadKpiGrid,
  MutationError,
  PipelineEmptyState,
  PipelineListItem,
  PipelinePageHeader,
  PipelineWorkspace,
  Select,
} from "@edunudg/ui";
import { useTenant } from "@/bootstrap/TenantProvider";
import { useMutationError } from "@/features/platform/hooks/useMutationError";
import { fetchCenterStudents } from "@/lib/centerStudentsApi";
import {
  createCenterInvoice,
  fetchCenterInvoices,
  fetchCenterPayments,
  recordCenterPayment,
  type CenterInvoiceRow,
} from "@/lib/centerFeesApi";
import {
  CREATE_INVOICE_STATUS_OPTIONS,
  feesInvoiceCounts,
  filterFeeInvoices,
  filterFeePayments,
  formatFeeDate,
  invoiceDisplayLabel,
  invoiceOptionLabel,
  invoiceStatusLabel,
  invoiceStatusTone,
  isInvoicePayable,
  PAYMENT_METHOD_OPTIONS,
  paymentSummaryLabel,
  type FeesSectionTab,
  type InvoiceListFilter,
} from "@/lib/centerFeesHelpers";
import { formatInrFromPaise, rupeesToPaise } from "@/lib/inrCurrency";
import type { InvoiceStatus } from "@/lib/centerFeesHelpers";
import "@/features/brand/franchiseApplications/franchiseApplications.css";
import "./fees/centerFees.css";

const emptyInvoiceForm = {
  studentId: "",
  amountRupees: "",
  invoiceNumber: "",
  status: "sent" as InvoiceStatus,
  dueAt: "",
};

const emptyPaymentForm = {
  invoiceId: "",
  amountRupees: "",
  method: "upi",
  paidAt: "",
};

const ICON_SEARCH = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

function invoiceToneForBadge(status: InvoiceStatus): "default" | "success" | "warning" {
  const tone = invoiceStatusTone(status);
  if (tone === "success") return "success";
  if (tone === "warning" || tone === "danger") return "warning";
  return "default";
}

export function FeesPage() {
  const tenant = useTenant();
  const qc = useQueryClient();
  const { error, clear, capture } = useMutationError();
  const centerId = tenant.centerId;
  const brandId = tenant.brandId;

  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [activeTab, setActiveTab] = useState<FeesSectionTab>("invoices");
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceListFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const students = useQuery({
    queryKey: ["center-students", centerId, brandId],
    enabled: !!centerId && !!brandId,
    queryFn: () => fetchCenterStudents(centerId!, brandId!),
  });

  const invoices = useQuery({
    queryKey: ["center-invoices", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterInvoices(centerId!),
  });

  const payments = useQuery({
    queryKey: ["center-payments", centerId],
    enabled: !!centerId,
    queryFn: () => fetchCenterPayments(centerId!),
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["center-invoices", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-payments", centerId] });
    void qc.invalidateQueries({ queryKey: ["center-dashboard-home", centerId] });
    void qc.invalidateQueries({ queryKey: ["shell-context-counts"] });
  };

  const createInvoice = useMutation({
    mutationFn: async () => {
      if (!centerId || !brandId) throw new Error("Center context required");
      clear();
      await createCenterInvoice({
        brandId,
        centerId,
        studentId: invoiceForm.studentId,
        amountCents: rupeesToPaise(invoiceForm.amountRupees),
        invoiceNumber: invoiceForm.invoiceNumber,
        status: invoiceForm.status,
        dueAt: invoiceForm.dueAt ? new Date(invoiceForm.dueAt).toISOString() : null,
      });
    },
    onSuccess: () => {
      invalidate();
      setInvoiceForm(emptyInvoiceForm);
    },
    onError: capture,
  });

  const createPayment = useMutation({
    mutationFn: async () => {
      if (!centerId || !brandId) throw new Error("Center context required");
      clear();
      await recordCenterPayment({
        brandId,
        centerId,
        invoiceId: paymentForm.invoiceId,
        amountCents: rupeesToPaise(paymentForm.amountRupees),
        method: paymentForm.method,
        paidAt: paymentForm.paidAt ? new Date(paymentForm.paidAt).toISOString() : undefined,
      });
    },
    onSuccess: () => {
      invalidate();
      setPaymentForm(emptyPaymentForm);
    },
    onError: capture,
  });

  const studentOptions = useMemo(
    () => [
      { value: "", label: "Select student…" },
      ...(students.data ?? []).map((student) => ({
        value: student.id,
        label: student.student_code
          ? `${student.full_name} (${student.student_code})`
          : student.full_name,
      })),
    ],
    [students.data]
  );

  const payableInvoices = useMemo(
    () => (invoices.data ?? []).filter((invoice) => isInvoicePayable(invoice.status)),
    [invoices.data]
  );

  const pageCounts = useMemo(() => feesInvoiceCounts(invoices.data ?? []), [invoices.data]);
  const visibleInvoices = useMemo(
    () => filterFeeInvoices(invoices.data ?? [], invoiceFilter, search),
    [invoices.data, invoiceFilter, search]
  );
  const visiblePayments = useMemo(
    () => filterFeePayments(payments.data ?? [], search),
    [payments.data, search]
  );

  const openInvoiceFilter = (filter: InvoiceListFilter) => {
    setActiveTab("invoices");
    setInvoiceFilter(filter);
  };

  const invoiceOptions = useMemo(
    () => [
      { value: "", label: "Select invoice…" },
      ...payableInvoices.map((invoice) => ({
        value: invoice.id,
        label: invoiceOptionLabel(invoice),
      })),
    ],
    [payableInvoices]
  );

  const canCreateInvoice =
    invoiceForm.studentId &&
    rupeesToPaise(invoiceForm.amountRupees) > 0 &&
    !createInvoice.isPending;

  const canRecordPayment =
    paymentForm.invoiceId &&
    rupeesToPaise(paymentForm.amountRupees) > 0 &&
    !createPayment.isPending;

  if (!centerId || !brandId) return <p className="ed-empty">Center context not found.</p>;

  const invoiceAside = (
    <CatalogFormPanel
      icon="+"
      title="Add invoice"
      description="Bill a enrolled student. Amount is stored in paise on invoices.amount_cents."
      footer={
        <Button onClick={() => createInvoice.mutate()} disabled={!canCreateInvoice}>
          {createInvoice.isPending ? "Creating…" : "Create invoice"}
        </Button>
      }
    >
      <Select
        label="Student"
        value={invoiceForm.studentId}
        onChange={(value) => setInvoiceForm((current) => ({ ...current, studentId: value }))}
        options={studentOptions}
        editable={!!students.data?.length}
      />
      <Input
        label="Amount (₹)"
        value={invoiceForm.amountRupees}
        onChange={(value) => setInvoiceForm((current) => ({ ...current, amountRupees: value }))}
        placeholder="2500.00"
      />
      <FormGrid columns={2}>
        <Input
          label="Invoice number"
          value={invoiceForm.invoiceNumber}
          onChange={(value) => setInvoiceForm((current) => ({ ...current, invoiceNumber: value }))}
          placeholder="Optional"
        />
        <Select
          label="Status"
          value={invoiceForm.status}
          onChange={(value) => setInvoiceForm((current) => ({ ...current, status: value as InvoiceStatus }))}
          options={CREATE_INVOICE_STATUS_OPTIONS}
        />
      </FormGrid>
      <Input
        label="Due date"
        type="date"
        value={invoiceForm.dueAt}
        onChange={(value) => setInvoiceForm((current) => ({ ...current, dueAt: value }))}
      />
    </CatalogFormPanel>
  );

  const paymentAside = (
    <CatalogFormPanel
      icon="₹"
      title="Record payment"
      description="Log a payment against invoices.invoice_id and update invoice status automatically."
      footer={
        <Button onClick={() => createPayment.mutate()} disabled={!canRecordPayment}>
          {createPayment.isPending ? "Saving…" : "Record payment"}
        </Button>
      }
    >
      <Select
        label="Invoice"
        value={paymentForm.invoiceId}
        onChange={(value) => setPaymentForm((current) => ({ ...current, invoiceId: value }))}
        options={invoiceOptions}
        editable={payableInvoices.length > 0}
      />
      <Input
        label="Amount (₹)"
        value={paymentForm.amountRupees}
        onChange={(value) => setPaymentForm((current) => ({ ...current, amountRupees: value }))}
        placeholder="2500.00"
      />
      <FormGrid columns={2}>
        <Select
          label="Method"
          value={paymentForm.method}
          onChange={(value) => setPaymentForm((current) => ({ ...current, method: value }))}
          options={PAYMENT_METHOD_OPTIONS}
        />
        <Input
          label="Paid on"
          type="date"
          value={paymentForm.paidAt}
          onChange={(value) => setPaymentForm((current) => ({ ...current, paidAt: value }))}
        />
      </FormGrid>
    </CatalogFormPanel>
  );

  return (
    <div className="ed-franchise-apps-page ed-center-fees-page">
      <PipelinePageHeader
        title="Fees & Payments"
        subtitle="Create student invoices and record fee payments for your center."
      />
      <MutationError message={error} />

      <LeadKpiGrid>
        <LeadKpiCard
          label="Outstanding"
          value={pageCounts.outstanding}
          hint="Sent or partial"
          active={activeTab === "invoices" && invoiceFilter === "outstanding"}
          onClick={() => openInvoiceFilter("outstanding")}
        />
        <LeadKpiCard
          label="Paid"
          value={pageCounts.paid}
          hint="Settled"
          active={activeTab === "invoices" && invoiceFilter === "paid"}
          onClick={() => openInvoiceFilter("paid")}
        />
        <LeadKpiCard
          label="Overdue"
          value={pageCounts.overdue}
          hint="Past due"
          tone="lost"
          active={activeTab === "invoices" && invoiceFilter === "overdue"}
          onClick={() => openInvoiceFilter("overdue")}
        />
        <LeadKpiCard
          label="Total"
          value={pageCounts.total}
          hint="All invoices"
          tone="total"
          active={activeTab === "invoices" && invoiceFilter === "all"}
          onClick={() => openInvoiceFilter("all")}
        />
      </LeadKpiGrid>

      <div className="ed-franchise-apps-page__toolbar">
        <label className="ed-franchise-apps-page__search">
          <span className="ed-franchise-apps-page__search-icon">{ICON_SEARCH}</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={activeTab === "payments" ? "Search payments..." : "Search invoices..."}
            aria-label={activeTab === "payments" ? "Search payments" : "Search invoices"}
          />
        </label>
        <FilterTabs
          options={[
            { value: "invoices", label: "Invoices", count: pageCounts.total },
            { value: "payments", label: "Payments", count: payments.data?.length ?? 0 },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value)}
          aria-label="Fees sections"
        />
      </div>

      <PipelineWorkspace
        detailOpen
        list={
          <div className="ed-pipeline-list-panel">
            {activeTab === "invoices" ? (
              <>
                {invoices.isLoading ? <p className="ed-text-sm ed-muted">Loading invoices…</p> : null}
                <DataList
                  variant="pipeline"
                  items={visibleInvoices}
                  empty={
                    <PipelineEmptyState message="No invoices yet — add one for an enrolled student." />
                  }
                  render={(invoice: CenterInvoiceRow) => (
                    <PipelineListItem
                      title={invoiceDisplayLabel(invoice.invoice_number, invoice.id)}
                      meta={`${invoice.student_name}${invoice.student_code ? ` · ${invoice.student_code}` : ""}`}
                      lines={[`${formatInrFromPaise(invoice.amount_cents)} · Due ${formatFeeDate(invoice.due_at)}`]}
                      badges={
                        <Badge tone={invoiceToneForBadge(invoice.status)}>
                          {invoiceStatusLabel(invoice.status)}
                        </Badge>
                      }
                      selected={invoice.id === selectedInvoiceId}
                      onSelect={() => setSelectedInvoiceId(invoice.id)}
                    />
                  )}
                />
              </>
            ) : (
              <>
                {payments.isLoading ? <p className="ed-text-sm ed-muted">Loading payments…</p> : null}
                <DataList
                  variant="pipeline"
                  items={visiblePayments}
                  empty={<PipelineEmptyState message="No payments recorded yet." />}
                  render={(payment) => (
                    <PipelineListItem
                      title={paymentSummaryLabel(payment.amount_cents, payment.method, payment.paid_at)}
                      meta={`${payment.student_name ?? "Student"}${payment.invoice_number ? ` · ${payment.invoice_number}` : ""}`}
                      onSelect={() => undefined}
                    />
                  )}
                />
              </>
            )}
          </div>
        }
        detail={
          <div className="ed-center-fees-page__aside">
            {activeTab === "invoices" ? invoiceAside : null}
            {paymentAside}
          </div>
        }
      />
    </div>
  );
}
