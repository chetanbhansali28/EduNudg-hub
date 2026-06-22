import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  RevenueInsightBanner,
  RevenueInvoiceStatusBadge,
  RevenuePageHeader,
  RevenueShell,
  RevenueStatCard,
  ThemeProvider,
} from "@edunudg/ui";

describe("Revenue UI theme", () => {
  it("renders page header with actions", () => {
    render(
      <ThemeProvider>
        <RevenuePageHeader
          title="Revenue & Usage"
          subtitle="Global network financial oversight and operational tracking."
          actions={<button type="button">Create Invoice</button>}
        />
      </ThemeProvider>
    );

    expect(screen.getByText("Revenue & Usage")).toBeDefined();
    expect(screen.getByRole("button", { name: "Create Invoice" })).toBeDefined();
    expect(document.querySelector(".ed-rev-header")).toBeTruthy();
  });

  it("renders stat card and invoice status badge", () => {
    render(
      <ThemeProvider>
        <RevenueShell>
          <RevenueStatCard
            label="Total Network Revenue"
            value="₹4,82,500.00"
            trend="↗ +12.4% from last month"
            icon={<span>$</span>}
            iconTone="blue"
          />
          <RevenueInvoiceStatusBadge label="PAID" tone="paid" />
        </RevenueShell>
      </ThemeProvider>
    );

    expect(screen.getByText("Total Network Revenue")).toBeDefined();
    expect(screen.getByText("PAID")).toBeDefined();
    expect(document.querySelector(".ed-rev")).toBeTruthy();
  });

  it("renders insight banner actions", () => {
    const onDismiss = vi.fn();
    render(
      <ThemeProvider>
        <RevenueInsightBanner onDismiss={onDismiss} primaryAction="View Growth Report" onPrimaryAction={vi.fn()}>
          Network expansion is accelerating.
        </RevenueInsightBanner>
      </ThemeProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
