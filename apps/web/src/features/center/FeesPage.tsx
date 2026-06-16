import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Badge,
  Button,
  CatalogFormPanel,
  CatalogPageHeader,
  CatalogWorkspace,
  DataList,
  FormGrid,
  Input,
  ListRow,
  MutationError,
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
  formatFeeDate,
  invoiceDisplayLabel,
  invoiceOptionLabel,
  invoiceStatusLabel,
  invoiceStatusTone,
  isInvoicePayable,
  PAYMENT_METHOD_OPTIONS,
  paymentSummaryLabel,
} from "@/lib/centerFeesHelpers";
import { formatInrFromPaise, rupeesToPaise } from "@/lib/inrCurrency";
import type { InvoiceStatus } from "@/lib/centerFeesHelpers";
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
    <div className="ed-center-fees-page">
      <CatalogPageHeader
        title="Fees & Payments"
        subtitle="Create student invoices and record fee payments for your center."
      />
      <MutationError message={error} />

      <CatalogWorkspace
        asideOpen
        main={
          <>
            <section className="ed-center-fees-page__section">
              <div className="ed-center-fees-page__section-head">
                <h2 className="ed-center-fees-page__section-title">Invoices</h2>
                <span className="ed-center-fees-page__section-meta">{(invoices.data ?? []).length} total</span>
              </div>
              {invoices.isLoading ? <p className="ed-text-sm ed-muted">Loading invoices…</p> : null}
              <DataList
                items={invoices.data ?? []}
                empty="No invoices yet — add one for an enrolled student."
                render={(invoice: CenterInvoiceRow) => (
                  <ListRow
                    aside={
                      <Badge tone={invoiceToneForBadge(invoice.status)}>
                        {invoiceStatusLabel(invoice.status)}
                      </Badge>
                    }
                  >
                    <div className="ed-center-fees-page__row">
                      <strong>{invoiceDisplayLabel(invoice.invoice_number, invoice.id)}</strong>
                      <p className="ed-text-sm ed-muted">
                        {invoice.student_name}
                        {invoice.student_code ? ` · ${invoice.student_code}` : ""}
                      </p>
                      <p className="ed-text-sm">
                        {formatInrFromPaise(invoice.amount_cents)} · Due {formatFeeDate(invoice.due_at)}
                      </p>
                    </div>
                  </ListRow>
                )}
              />
            </section>

            <section className="ed-center-fees-page__section">
              <div className="ed-center-fees-page__section-head">
                <h2 className="ed-center-fees-page__section-title">Payments</h2>
                <span className="ed-center-fees-page__section-meta">{(payments.data ?? []).length} recorded</span>
              </div>
              {payments.isLoading ? <p className="ed-text-sm ed-muted">Loading payments…</p> : null}
              <DataList
                items={payments.data ?? []}
                empty="No payments recorded yet."
                render={(payment) => (
                  <ListRow>
                    <div className="ed-center-fees-page__row">
                      <strong>{paymentSummaryLabel(payment.amount_cents, payment.method, payment.paid_at)}</strong>
                      <p className="ed-text-sm ed-muted">
                        {payment.student_name ?? "Student"}
                        {payment.invoice_number ? ` · ${payment.invoice_number}` : ""}
                      </p>
                    </div>
                  </ListRow>
                )}
              />
            </section>
          </>
        }
        aside={
          <div className="ed-center-fees-page__aside">
            {invoiceAside}
            {paymentAside}
          </div>
        }
      />
    </div>
  );
}
