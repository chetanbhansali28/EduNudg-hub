import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@edunudg/ui";
import { RevenuePageView } from "./RevenuePageView";

const noop = () => undefined;

describe("RevenuePageView", () => {
  it("renders invoice rows from props", () => {
    render(
      <ThemeProvider>
        <RevenuePageView
          invoices={[
            {
              id: "inv-1",
              brand_id: "b1",
              amount_cents: 1240000,
              currency: "INR",
              status: "paid",
              created_at: "2023-10-24T00:00:00.000Z",
              brands: { name: "EduNest Learning" },
            },
          ]}
          metrics={[]}
          brandOptions={[]}
          activeSubscriptions={2}
          brandCount={2}
          error={null}
          invoiceForm={{ brand_id: "", amount_rupees: "", status: "draft" }}
          onInvoiceFormChange={noop}
          onCreateInvoice={noop}
          createInvoicePending={false}
          createInvoiceOpen={false}
          onCreateInvoiceOpenChange={noop}
          editingInvoiceId={null}
          editInvoice={{ brand_id: "", amount_rupees: "", status: "draft" }}
          onEditInvoice={noop}
          onEditInvoiceChange={noop}
          onCancelInvoiceEdit={noop}
          onSaveInvoice={noop}
          onDeleteInvoice={noop}
          deleteInvoicePending={false}
          metricForm={{
            brand_id: "",
            metric_date: "",
            enrollments_count: "0",
            revenue_rupees: "0",
            active_centers: "0",
          }}
          onMetricFormChange={noop}
          onCreateMetric={noop}
          createMetricPending={false}
          createMetricOpen={false}
          onCreateMetricOpenChange={noop}
          editingMetricId={null}
          editMetric={{
            brand_id: "",
            metric_date: "",
            enrollments_count: "0",
            revenue_rupees: "0",
            active_centers: "0",
          }}
          onEditMetric={noop}
          onEditMetricChange={noop}
          onCancelMetricEdit={noop}
          onSaveMetric={noop}
          onDeleteMetric={noop}
          deleteMetricPending={false}
        />
      </ThemeProvider>
    );

    expect(screen.getAllByText("EduNest Learning").length).toBeGreaterThan(0);
    expect(document.querySelector(".ed-rev-invoice-table")).toBeTruthy();
  });
});
