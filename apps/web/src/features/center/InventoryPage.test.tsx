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
    photoUrl: null,
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
      expect(screen.getByText("Level 1 Book")).toBeDefined();
    });
    expect(screen.queryByText(/Center \//)).toBeNull();
    expect(container.querySelector(".ed-lead-kpi-grid")).toBeTruthy();
    const kpiLabels = [...container.querySelectorAll(".ed-lead-kpi__label")].map((el) => el.textContent);
    expect(kpiLabels).toEqual(["In stock", "Low stock", "Incoming", "Total"]);
    expect(screen.getByRole("tablist", { name: "Inventory filter" })).toBeDefined();
    expect(screen.getByLabelText("Search inventory")).toBeDefined();
    expect(container.querySelector(".ed-pipeline-workspace")).toBeTruthy();
    expect(screen.getByText("IN STOCK")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Orders (last 6 months)")).toBeDefined();
      expect(screen.getByRole("heading", { name: /On the way/ })).toBeDefined();
      expect(screen.getByText("Inventory Value")).toBeDefined();
    });
  });

  it("exports inventory csv from toolbar action", async () => {
    const { downloadInventoryCsv } = await import("@/lib/centerInventoryApi");
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Level 1 Book")).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: /Export CSV/i }));
    expect(downloadInventoryCsv).toHaveBeenCalledWith(inventoryRows);
  });
});
