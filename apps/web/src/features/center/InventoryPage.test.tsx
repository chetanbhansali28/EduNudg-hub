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
  it("renders mock-style inventory layout and item detail", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Inventory")).toBeDefined();
      expect(screen.getByText("Manage on-hand stock and track incoming merchandise.")).toBeDefined();
      expect(screen.getByText("Level 1 Book")).toBeDefined();
    });
    expect(screen.queryByText(/Center \//)).toBeNull();
    expect(screen.getByText("Stock by item")).toBeDefined();
    expect(screen.getByText(/1 ITEMS SHOWN/)).toBeDefined();
    expect(screen.getByText("IN STOCK")).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("Orders (last 6 months)")).toBeDefined();
      expect(screen.getByText("On the way")).toBeDefined();
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
