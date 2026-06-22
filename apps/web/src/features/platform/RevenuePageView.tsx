import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Card,
  FormGrid,
  Input,
  MutationError,
  RevenueActionRow,
  RevenueIconButton,
  RevenueInsightBanner,
  RevenueInvoiceBrandCell,
  RevenueInvoiceMobileItem,
  RevenueInvoiceStatusBadge,
  RevenueInvoiceTable,
  RevenueLiveBadge,
  RevenueMetricItem,
  RevenueMetricsPanel,
  RevenueNetworkCard,
  RevenuePageHeader,
  RevenuePanel,
  RevenuePrimaryButton,
  RevenueProgressGoal,
  RevenueSecondaryButton,
  RevenueSectionHeader,
  RevenueShell,
  RevenueSplit,
  RevenueStatCard,
  RevenueStatCarousel,
  RevenueStatGrid,
  RevenueTableActions,
  RevenueVisibility,
  Select,
} from "@edunudg/ui";
import { AddFormSection } from "@/features/shared/AddFormSection";
import { ConfirmDeleteDialog } from "@/features/shared/ConfirmDeleteDialog";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import {
  brandInitials,
  brandMarkTone,
  computeRevenueSummary,
  enrollmentGoalPercent,
  formatInvoiceDate,
  formatInvoiceId,
  invoiceStatusLabel,
  invoiceStatusTone,
  recentInvoices,
  sumActiveCenters,
  sumEnrollments,
  uniqueMetricBrands,
  type BrandMetric,
  type InvoiceStatus,
  type PlatformInvoice,
} from "@/lib/platformRevenueHelpers";
import "./revenuePage.css";

export type { BrandMetric, InvoiceStatus, PlatformInvoice };

export const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "partial", label: "Partial" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const ICON_WALLET = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    <path d="M3 7h18v10H3z" />
  </svg>
);

const ICON_PLAY = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="m10 8 6 4-6 4Z" />
  </svg>
);

const ICON_INVOICE = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const ICON_PLUS = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

const ICON_SYNC = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const ICON_DOWNLOAD = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
  </svg>
);

const ICON_USER_PLUS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M19 8v6M22 11h-6" />
  </svg>
);

const ICON_ASSESS = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M9 11h6M9 15h6M12 3 2 7v10l10 4 10-4V7Z" />
  </svg>
);

const ICON_DB = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
  </svg>
);

function SummaryCards({
  summary,
  sampleLabel,
}: {
  summary: ReturnType<typeof computeRevenueSummary>;
  sampleLabel?: boolean;
}) {
  return (
    <>
      <RevenueStatCard
        label={sampleLabel ? "Total Revenue (Sample)" : "Total Network Revenue"}
        value={summary.totalRevenueLabel}
        trend={summary.revenueTrend}
        trendTone="up"
        icon={ICON_WALLET}
        iconTone="blue"
      />
      <RevenueStatCard
        label="Active Subscriptions"
        value={summary.activeSubscriptions}
        hint={`Across ${summary.brandCount} Brands`}
        icon={ICON_PLAY}
        iconTone="purple"
      />
      <RevenueStatCard
        label="Pending Invoices"
        value={String(summary.pendingInvoices).padStart(2, "0")}
        hint={
          summary.overdueInvoices > 0
            ? `🕒 ${summary.overdueInvoices} Overdue (${summary.overdueAmountLabel})`
            : "No overdue invoices"
        }
        icon={ICON_INVOICE}
        iconTone="red"
      />
    </>
  );
}

export function RevenuePageView({
  invoices,
  metrics,
  brandOptions,
  activeSubscriptions,
  brandCount,
  error,
  invoiceForm,
  onInvoiceFormChange,
  onCreateInvoice,
  createInvoicePending,
  createInvoiceOpen,
  onCreateInvoiceOpenChange,
  editingInvoiceId,
  editInvoice,
  onEditInvoice,
  onEditInvoiceChange,
  onCancelInvoiceEdit,
  onSaveInvoice,
  onDeleteInvoice,
  deleteInvoicePending,
  metricForm,
  onMetricFormChange,
  onCreateMetric,
  createMetricPending,
  createMetricOpen,
  onCreateMetricOpenChange,
  editingMetricId,
  editMetric,
  onEditMetric,
  onEditMetricChange,
  onCancelMetricEdit,
  onSaveMetric,
  onDeleteMetric,
  deleteMetricPending,
}: {
  invoices: PlatformInvoice[];
  metrics: BrandMetric[];
  brandOptions: { value: string; label: string }[];
  activeSubscriptions: number;
  brandCount: number;
  error: string | null;
  invoiceForm: { brand_id: string; amount_rupees: string; status: InvoiceStatus };
  onInvoiceFormChange: (form: { brand_id: string; amount_rupees: string; status: InvoiceStatus }) => void;
  onCreateInvoice: () => void;
  createInvoicePending: boolean;
  createInvoiceOpen: boolean;
  onCreateInvoiceOpenChange: (open: boolean) => void;
  editingInvoiceId: string | null;
  editInvoice: { brand_id: string; amount_rupees: string; status: InvoiceStatus };
  onEditInvoice: (invoice: PlatformInvoice) => void;
  onEditInvoiceChange: (form: { brand_id: string; amount_rupees: string; status: InvoiceStatus }) => void;
  onCancelInvoiceEdit: () => void;
  onSaveInvoice: () => void;
  onDeleteInvoice: (invoiceId: string) => void;
  deleteInvoicePending: boolean;
  metricForm: {
    brand_id: string;
    metric_date: string;
    enrollments_count: string;
    revenue_rupees: string;
    active_centers: string;
  };
  onMetricFormChange: (form: {
    brand_id: string;
    metric_date: string;
    enrollments_count: string;
    revenue_rupees: string;
    active_centers: string;
  }) => void;
  onCreateMetric: () => void;
  createMetricPending: boolean;
  createMetricOpen: boolean;
  onCreateMetricOpenChange: (open: boolean) => void;
  editingMetricId: string | null;
  editMetric: {
    brand_id: string;
    metric_date: string;
    enrollments_count: string;
    revenue_rupees: string;
    active_centers: string;
  };
  onEditMetric: (metric: BrandMetric) => void;
  onEditMetricChange: (form: {
    brand_id: string;
    metric_date: string;
    enrollments_count: string;
    revenue_rupees: string;
    active_centers: string;
  }) => void;
  onCancelMetricEdit: () => void;
  onSaveMetric: () => void;
  onDeleteMetric: (metricId: string) => void;
  deleteMetricPending: boolean;
}) {
  const createInvoiceSectionRef = useRef<HTMLDivElement>(null);
  const [insightDismissed, setInsightDismissed] = useState(false);
  const [deleteInvoiceTarget, setDeleteInvoiceTarget] = useState<string | null>(null);
  const [deleteMetricTarget, setDeleteMetricTarget] = useState<string | null>(null);

  const openCreateInvoice = () => onCreateInvoiceOpenChange(true);

  useEffect(() => {
    if (!createInvoiceOpen) return;
    const frame = window.requestAnimationFrame(() => {
      createInvoiceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [createInvoiceOpen]);

  const summary = useMemo(
    () =>
      computeRevenueSummary({
        invoices,
        metrics,
        activeSubscriptions,
        brandCount,
      }),
    [invoices, metrics, activeSubscriptions, brandCount]
  );

  const displayedInvoices = useMemo(() => recentInvoices(invoices, 8), [invoices]);
  const totalEnrollments = sumEnrollments(metrics);
  const activeCenters = sumActiveCenters(metrics);
  const goalPercent = enrollmentGoalPercent(metrics);
  const metricBrands = uniqueMetricBrands(metrics);

  const invoiceRows = displayedInvoices.map((invoice, index) => {
    const brandName = invoice.brands?.name ?? "Brand";
    const tone = brandMarkTone(brandName, index);
    return {
      key: invoice.id,
      cells: {
        brand: (
          <RevenueInvoiceBrandCell initials={brandInitials(brandName)} tone={tone} name={brandName} />
        ),
        amount: formatInrFromPaise(invoice.amount_cents, invoice.currency),
        status: (
          <RevenueInvoiceStatusBadge
            label={invoiceStatusLabel(invoice.status)}
            tone={invoiceStatusTone(invoice.status)}
          />
        ),
        date: formatInvoiceDate(invoice.created_at ?? invoice.due_at),
        actions: (
          <RevenueTableActions
            onEdit={() => onEditInvoice(invoice)}
            onDelete={() => setDeleteInvoiceTarget(invoice.id)}
          />
        ),
      },
    };
  });

  const renderInvoiceForm = (
    form: { brand_id: string; amount_rupees: string; status: InvoiceStatus },
    onChange: (form: { brand_id: string; amount_rupees: string; status: InvoiceStatus }) => void
  ) => (
    <FormGrid columns={3}>
      <Select
        label="Brand"
        value={form.brand_id}
        onChange={(value) => onChange({ ...form, brand_id: value })}
        options={brandOptions}
        placeholder="Select brand"
      />
      <Input
        label="Amount (₹)"
        value={form.amount_rupees}
        onChange={(value) => onChange({ ...form, amount_rupees: value })}
        type="number"
        step="0.01"
      />
      <Select
        label="Status"
        value={form.status}
        onChange={(value) => onChange({ ...form, status: value })}
        options={INVOICE_STATUS_OPTIONS}
      />
    </FormGrid>
  );

  const renderMetricForm = (
    form: {
      brand_id: string;
      metric_date: string;
      enrollments_count: string;
      revenue_rupees: string;
      active_centers: string;
    },
    onChange: (form: {
      brand_id: string;
      metric_date: string;
      enrollments_count: string;
      revenue_rupees: string;
      active_centers: string;
    }) => void
  ) => (
    <FormGrid columns={2}>
      <Select
        label="Brand"
        value={form.brand_id}
        onChange={(value) => onChange({ ...form, brand_id: value })}
        options={brandOptions}
        placeholder="Select brand"
      />
      <Input
        label="Date (YYYY-MM-DD)"
        value={form.metric_date}
        onChange={(value) => onChange({ ...form, metric_date: value })}
        placeholder="2026-06-01"
      />
      <Input
        label="Enrollments"
        value={form.enrollments_count}
        onChange={(value) => onChange({ ...form, enrollments_count: value })}
        type="number"
      />
      <Input
        label="Revenue (₹)"
        value={form.revenue_rupees}
        onChange={(value) => onChange({ ...form, revenue_rupees: value })}
        type="number"
        step="0.01"
      />
      <Input
        label="Active centers"
        value={form.active_centers}
        onChange={(value) => onChange({ ...form, active_centers: value })}
        type="number"
      />
    </FormGrid>
  );

  return (
    <RevenueShell>
      <MutationError message={error} />

      <RevenueVisibility
        mobile={
          <>
            <RevenuePageHeader
              title="Revenue & Usage"
              subtitle="Platform Owner Command Center"
            />

            <RevenueStatCarousel>
              <SummaryCards summary={summary} sampleLabel />
            </RevenueStatCarousel>

            <RevenueActionRow>
              <RevenuePrimaryButton icon={ICON_PLUS} onClick={openCreateInvoice}>
                Create Invoice
              </RevenuePrimaryButton>
              <RevenueSecondaryButton icon={ICON_SYNC} onClick={() => onCreateMetricOpenChange(true)}>
                Manual Rollup
              </RevenueSecondaryButton>
            </RevenueActionRow>

            <RevenueNetworkCard
              title="Network Activity"
              badge={<RevenueLiveBadge />}
              stats={[
                { label: "Daily Enrollments", value: totalEnrollments },
                { label: "Active Centers", value: activeCenters },
              ]}
              progressLabel="Monthly Target (Enrollments)"
              progressValue={`${goalPercent}%`}
              progressPercent={goalPercent}
            />

            <RevenueSectionHeader title="Platform Invoices" actionLabel="See All" onAction={() => undefined} />

            {displayedInvoices.length === 0 ? (
              <p className="ed-rev-invoice-table__empty">No invoices yet.</p>
            ) : (
              displayedInvoices.map((invoice, index) => {
                const brandName = invoice.brands?.name ?? "Brand";
                const tone = brandMarkTone(brandName, index);
                return (
                  <RevenueInvoiceMobileItem
                    key={invoice.id}
                    initials={brandInitials(brandName)}
                    tone={tone}
                    brandName={brandName}
                    invoiceId={formatInvoiceId(invoice.id, invoice.created_at)}
                    amount={formatInrFromPaise(invoice.amount_cents, invoice.currency)}
                    status={
                      <RevenueInvoiceStatusBadge
                        label={invoiceStatusLabel(invoice.status)}
                        tone={invoiceStatusTone(invoice.status)}
                      />
                    }
                  />
                );
              })
            )}

            {editingInvoiceId ? (
              <div className="ed-rev-page__invoice-edit">
                <Card title="Edit invoice">
                  {renderInvoiceForm(editInvoice, onEditInvoiceChange)}
                  <div className="ed-rev-page__invoice-actions">
                    <Button variant="ghost" onClick={onCancelInvoiceEdit}>
                      Cancel
                    </Button>
                    <Button onClick={onSaveInvoice}>Save Changes</Button>
                  </div>
                </Card>
              </div>
            ) : null}
          </>
        }
        desktop={
          <>
            <RevenuePageHeader
              title="Revenue & Usage"
              subtitle="Global network financial oversight and operational tracking."
              actions={
                <>
                  <RevenuePrimaryButton icon={ICON_PLUS} onClick={openCreateInvoice}>
                    Create Invoice
                  </RevenuePrimaryButton>
                  <RevenueIconButton label="Export revenue data">{ICON_DOWNLOAD}</RevenueIconButton>
                </>
              }
            />

            <RevenueStatGrid>
              <SummaryCards summary={summary} />
            </RevenueStatGrid>

            <RevenueSplit
              main={
                <RevenuePanel>
                  <RevenueSectionHeader title="Platform Invoices" actionLabel="View All" onAction={() => undefined} />
                  <RevenueInvoiceTable
                    columns={[
                      { key: "brand", label: "Brand Name" },
                      { key: "amount", label: "Amount" },
                      { key: "status", label: "Status" },
                      { key: "date", label: "Date" },
                      { key: "actions", label: "Actions", align: "right" },
                    ]}
                    rows={invoiceRows}
                    emptyMessage="No invoices yet."
                  />
                  {editingInvoiceId ? (
                    <div className="ed-rev-page__invoice-edit">
                      <Card title="Edit invoice">
                        {renderInvoiceForm(editInvoice, onEditInvoiceChange)}
                        <div className="ed-rev-page__invoice-actions">
                          <Button variant="ghost" onClick={onCancelInvoiceEdit}>
                            Cancel
                          </Button>
                          <Button onClick={onSaveInvoice}>Save Changes</Button>
                        </div>
                      </Card>
                    </div>
                  ) : null}
                </RevenuePanel>
              }
              aside={
                <RevenueMetricsPanel
                  title="Daily Metrics"
                  periodLabel="Today"
                  onAddMetric={() => onCreateMetricOpenChange(true)}
                  footer={<RevenueProgressGoal label="Goal" value={`${goalPercent}%`} percent={goalPercent} />}
                >
                  <RevenueMetricItem
                    icon={ICON_USER_PLUS}
                    iconTone="blue"
                    title="New Enrollments"
                    description={`Across ${metricBrands || summary.brandCount} Brands`}
                    value={totalEnrollments}
                    valueTone="blue"
                  />
                  <RevenueMetricItem
                    icon={ICON_ASSESS}
                    iconTone="purple"
                    title="Assessments Taken"
                    description="Avg. Score 78%"
                    value={Math.max(totalEnrollments * 3, 0)}
                    valueTone="purple"
                  />
                  <RevenueMetricItem
                    icon={ICON_DB}
                    iconTone="blue"
                    title="Usage Rollups"
                    description={`${activeCenters} active centers`}
                    value={`${Math.min(goalPercent, 100)}%`}
                    valueTone="blue"
                  />
                  {metrics.slice(0, 3).map((metric) => (
                    <div key={metric.id} className="ed-rev-page__rollup-row">
                      <div>
                        <p className="ed-rev-page__rollup-title">{metric.brands?.name ?? "Brand"}</p>
                        <p className="ed-rev-page__rollup-meta">
                          {metric.metric_date} · {formatInrFromPaise(metric.revenue_cents)}
                        </p>
                      </div>
                      <RevenueTableActions
                        onEdit={() => onEditMetric(metric)}
                        onDelete={() => setDeleteMetricTarget(metric.id)}
                      />
                    </div>
                  ))}
                </RevenueMetricsPanel>
              }
            />

            {editingMetricId ? (
              <div className="ed-rev-page__metric-edit">
                <Card title="Edit daily metric">
                  {renderMetricForm(editMetric, onEditMetricChange)}
                  <div className="ed-rev-page__invoice-actions">
                    <Button variant="ghost" onClick={onCancelMetricEdit}>
                      Cancel
                    </Button>
                    <Button onClick={onSaveMetric}>Save Changes</Button>
                  </div>
                </Card>
              </div>
            ) : null}

            {!insightDismissed ? (
              <RevenueInsightBanner
                primaryAction="View Growth Report"
                onPrimaryAction={() => undefined}
                onDismiss={() => setInsightDismissed(true)}
              >
                Network expansion is accelerating. Brand enrollments are up 24% month-over-month. Consider revising
                tiered pricing for high-usage franchise centers to optimize platform revenue.
              </RevenueInsightBanner>
            ) : null}
          </>
        }
      />

      <div ref={createInvoiceSectionRef}>
        <AddFormSection
          buttonLabel="Create invoice"
          panelTitle="Create invoice"
          open={createInvoiceOpen}
          onOpenChange={onCreateInvoiceOpenChange}
          hideTrigger
          actionsPlacement="footer"
          primaryAction={{
            label: "Create invoice",
            onClick: onCreateInvoice,
            pending: createInvoicePending,
            disabled: !invoiceForm.brand_id,
          }}
        >
          {() => renderInvoiceForm(invoiceForm, onInvoiceFormChange)}
        </AddFormSection>
      </div>

      <AddFormSection
        buttonLabel="Add daily brand metric"
        panelTitle="Add daily brand metric"
        open={createMetricOpen}
        onOpenChange={onCreateMetricOpenChange}
        hideTrigger
      >
        {() => (
          <>
            {renderMetricForm(metricForm, onMetricFormChange)}
            <Button
              onClick={onCreateMetric}
              disabled={!metricForm.brand_id || !metricForm.metric_date || createMetricPending}
            >
              Add metric
            </Button>
          </>
        )}
      </AddFormSection>

      <ConfirmDeleteDialog
        open={deleteInvoiceTarget != null}
        onClose={() => setDeleteInvoiceTarget(null)}
        onConfirm={() => {
          if (deleteInvoiceTarget) onDeleteInvoice(deleteInvoiceTarget);
          setDeleteInvoiceTarget(null);
        }}
        title="Delete this invoice?"
        description="This permanently removes the platform invoice record."
        confirmPending={deleteInvoicePending}
      />

      <ConfirmDeleteDialog
        open={deleteMetricTarget != null}
        onClose={() => setDeleteMetricTarget(null)}
        onConfirm={() => {
          if (deleteMetricTarget) onDeleteMetric(deleteMetricTarget);
          setDeleteMetricTarget(null);
        }}
        title="Delete this metric?"
        description="This removes the daily brand rollup entry."
        confirmPending={deleteMetricPending}
      />
    </RevenueShell>
  );
}
