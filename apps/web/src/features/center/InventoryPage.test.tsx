import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "@edunudg/ui";
import { InventoryPage } from "@/features/center/InventoryPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    brandId: "brand-1",
    centerId: "center-1",
    brandSlug: "abacusworld",
    centerSlug: "koramangala",
    portalType: "center",
  }),
}));

const inventoryRows = [
  {
    catalogItemId: "item-a",
    sku: "BOOK-1",
    name: "Level 1 Book",
    priceCents: 50000,
    photoUrl: "https://cdn.example.com/book.jpg",
    onHand: 10,
    incoming: 5,
    allocated: 2,
    available: 8,
  },
];

vi.mock("@/lib/centerInventoryApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/centerInventoryApi")>();
  return {
    ...actual,
    fetchCenterInventorySummary: vi.fn(async () => inventoryRows),
    fetchInventoryValueStats: vi.fn(async () => ({ totalCents: 500000, trendPercent: 12 })),
    fetchCatalogItemOrderHistory: vi.fn(async () => [
      {
        orderId: "order-1",
        orderDate: "2026-02-01T00:00:00Z",
        orderStatus: "placed",
        quantity: 5,
        unitPriceCents: 50000,
      },
    ]),
    fetchCatalogItemIncomingLines: vi.fn(async () => [
      {
        orderId: "order-2",
        orderDate: "2026-03-01T00:00:00Z",
        orderStatus: "shipped",
        quantity: 5,
        estimatedDelivery: "2026-03-15T00:00:00Z",
      },
    ]),
    downloadInventoryCsv: vi.fn(),
  };
});

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <MemoryRouter>
          <InventoryPage />
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("InventoryPage", () => {
  it("regression_center_inventory_page_matches_curriculum_stats_chrome", async () => {
    const { container } = renderPage();

    await waitFor(() => {
      expect(screen.getByText("Inventory")).toBeDefined();
      expect(screen.getByText("Manage on-hand stock and track incoming merchandise.")).toBeDefined();
      expect(screen.getAllByText("Level 1 Book").length).toBeGreaterThan(0);
    });
    expect(screen.queryByText(/Center \//)).toBeNull();
    expect(container.querySelector(".ed-lead-kpi-grid")).toBeTruthy();
    const kpiLabels = [...container.querySelectorAll(".ed-lead-kpi__label")].map((el) => el.textContent);
    expect(kpiLabels).toEqual(["In stock", "Low stock", "Incoming", "Total"]);
    expect(screen.getByRole("tablist", { name: "Inventory filter" })).toBeDefined();
    expect(screen.getByLabelText("Search inventory")).toBeDefined();
    expect(container.querySelector(".ed-pipeline-workspace")).toBeTruthy();
    expect(screen.getAllByText("IN STOCK").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText("Orders (last 6 months)")).toBeDefined();
      expect(screen.getByRole("heading", { name: /On the way/ })).toBeDefined();
      expect(screen.getByText("Inventory Value")).toBeDefined();
    });
    expect(container.querySelector(".ed-pipeline-detail-panel")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Place New Order" }).classList.contains("ed-btn--primary")).toBe(true);
  });

  it("exports inventory csv from toolbar action", async () => {
    const { downloadInventoryCsv } = await import("@/lib/centerInventoryApi");
    renderPage();
    await waitFor(() => {
      expect(screen.getAllByText("Level 1 Book").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));
    expect(downloadInventoryCsv).toHaveBeenCalledWith(inventoryRows);
  });

  it("regression_center_inventory_detail_photo_is_half_width", async () => {
    const { container } = renderPage();
    const photo = await screen.findByRole("img", { name: "Level 1 Book" });
    expect(photo.classList.contains("ed-inv-detail__photo")).toBe(true);
    expect(container.querySelector(".ed-inv-detail__top")).toBeTruthy();
    expect(container.querySelector(".ed-inv-detail__top .ed-pipeline-detail-facts")).toBeTruthy();

    const css = readFileSync(resolve(__dirname, "inventory/inventory.css"), "utf8");
    expect(css).toMatch(/\.ed-inv-detail__top \{[\s\S]*grid-template-columns:\s*minmax\(0,\s*50%\)/);
    expect(css).toMatch(/\.ed-inv-detail__hero \{[\s\S]*justify-content:\s*flex-start/);
  });

  it("regression_center_inventory_detail_uses_pipeline_theme", async () => {
    const { container } = renderPage();
    const orderBtn = await screen.findByRole("button", { name: "Place New Order" });
    expect(container.querySelector(".ed-pipeline-detail-panel")).toBeTruthy();
    expect(orderBtn.classList.contains("ed-btn")).toBe(true);
    expect(orderBtn.classList.contains("ed-btn--primary")).toBe(true);
    expect(screen.queryByRole("link", { name: "Place New Order" })).toBeNull();

    const css = readFileSync(resolve(__dirname, "inventory/inventory.css"), "utf8");
    expect(css).not.toMatch(/ed-inv-detail__order-btn/);
    expect(css).not.toMatch(/linear-gradient\(145deg,\s*var\(--ed-inv-purple\)/);
    expect(css).toMatch(/\.ed-inv-value-card \{[\s\S]*border-top:\s*1px solid var\(--ed-border\)/);
    expect(css).toMatch(/\.ed-center-inventory-page \.ed-pipeline-detail-panel__head \{[\s\S]*padding-top:\s*1\.5rem/);
    expect(css).toMatch(/\.ed-center-inventory-page \.ed-pipeline-detail-panel__body \{[\s\S]*padding-top:\s*1\.75rem/);
    const facts = container.querySelector(".ed-pipeline-detail-facts");
    expect(facts?.textContent).toContain("Available");
    expect(facts?.textContent).toContain("On hand");
  });

  it("regression_center_inventory_detail_splits_on_the_way_and_orders", async () => {
    const { container } = renderPage();
    await screen.findByRole("heading", { name: /On the way/ });
    expect(container.querySelector(".ed-inv-detail__split")).toBeTruthy();
    expect(container.querySelector(".ed-inv-detail__split")?.querySelector("h3")?.textContent).toMatch(/On the way/);
    expect(screen.getByText("Orders (last 6 months)")).toBeDefined();

    const css = readFileSync(resolve(__dirname, "inventory/inventory.css"), "utf8");
    expect(css).toMatch(/\.ed-inv-detail__split \{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(0,\s*1fr\)/);
  });
});
