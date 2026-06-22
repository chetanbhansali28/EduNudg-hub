import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { RevenuePage } from "./RevenuePage";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
  }),
}));

function chain(result: { data: unknown; error: unknown }, terminal: "order" | "limit" = "order") {
  const resolved = Promise.resolve(result);
  const c = {
    select: vi.fn(() => c),
    insert: vi.fn(() => c),
    update: vi.fn(() => c),
    delete: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    order: vi.fn(() => (terminal === "order" ? resolved : c)),
    limit: vi.fn(() => resolved),
  };
  return c;
}

function renderRevenue() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <RevenuePage />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("RevenuePage", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === "platform_invoices") {
        return chain({
          data: [
            {
              id: "inv-1",
              brand_id: "b1",
              amount_cents: 1240000,
              currency: "INR",
              status: "paid",
              created_at: "2023-10-24T00:00:00.000Z",
              brands: { name: "EduNest Learning" },
            },
          ],
          error: null,
        });
      }
      if (table === "analytics_daily_brand") {
        return chain(
          {
            data: [
              {
                id: "m1",
                brand_id: "b1",
                metric_date: "2026-06-01",
                enrollments_count: 128,
                revenue_cents: 42500000,
                active_centers: 4,
                brands: { name: "EduNest Learning" },
              },
            ],
            error: null,
          },
          "limit"
        );
      }
      if (table === "brand_subscriptions") {
        return chain({
          data: [
            { id: "s1", status: "active" },
            { id: "s2", status: "active" },
          ],
          error: null,
        });
      }
      if (table === "brands") {
        return chain({
          data: [
            { id: "b1", name: "EduNest Learning" },
            { id: "b2", name: "BrightStep Intl" },
          ],
          error: null,
        });
      }
      return chain({ data: [], error: null });
    });
  });

  it("renders redesigned revenue shell and summary layout", async () => {
    renderRevenue();
    expect(await screen.findAllByText("Revenue & Usage")).toHaveLength(2);
    expect(screen.getAllByText("Platform Invoices").length).toBeGreaterThan(0);
    expect(document.querySelector(".ed-rev")).toBeTruthy();
    expect(document.querySelector(".ed-rev-stat-grid")).toBeTruthy();
    expect(document.querySelector(".ed-rev-split")).toBeTruthy();
  });

  it("regression_revenue_page_has_create_invoice_form", async () => {
    renderRevenue();
    const createButtons = await screen.findAllByRole("button", { name: "Create Invoice" });
    expect(createButtons.length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Create invoice" })).toBeNull();
    fireEvent.click(createButtons[0]!);
    expect(screen.getByRole("button", { name: "Create invoice" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  it("regression_create_invoice_scrolls_to_form", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    renderRevenue();
    const createButtons = await screen.findAllByRole("button", { name: "Create Invoice" });
    fireEvent.click(createButtons[0]!);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("regression_revenue_page_has_manual_rollup_form", async () => {
    renderRevenue();
    const rollupButtons = await screen.findAllByRole("button", { name: "Manual Rollup" });
    fireEvent.click(rollupButtons[0]!);
    expect(screen.getByRole("button", { name: "Add metric" })).toBeDefined();
  });
});
