import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandDetailPage } from "./BrandDetailPage";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
  }),
}));

function chain(result: { data: unknown; error: unknown; count?: number }) {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    in: vi.fn(() => c),
    gte: vi.fn(() => c),
    order: vi.fn(() => c),
    limit: vi.fn(() => c),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
  };
  return c;
}

function countChain(count: number) {
  const c = {
    select: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    in: vi.fn(() => Promise.resolve({ data: null, error: null, count })),
  };
  return c;
}

function renderDetail(slug = "demo") {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter initialEntries={[`/admin/brands/${slug}`]}>
      <QueryClientProvider client={qc}>
        <Routes>
          <Route path="/admin/brands/:brandSlug" element={<BrandDetailPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("BrandDetailPage", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            id: "b1",
            slug: "demo",
            name: "Demo Brand",
            status: "active",
            logo_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          error: null,
        });
      }
      if (table === "franchise_centers") {
        return chain({ data: [], error: null });
      }
      if (table === "domain_mappings") {
        return chain({
          data: [{ hostname: "demo.localhost", portal_type: "brand", is_primary: true }],
          error: null,
        });
      }
      if (table === "brand_subscriptions") {
        return chain({ data: null, error: null });
      }
      if (table === "students") {
        return countChain(12);
      }
      if (table === "student_enrollments") {
        let head = false;
        const c = {
          select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
            head = !!opts?.head;
            return c;
          }),
          eq: vi.fn(() => {
            if (head) return Promise.resolve({ data: null, error: null, count: 5 });
            return c;
          }),
          gte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
        return c;
      }
      if (table === "royalty_settlements") {
        return chain({ data: [], error: null });
      }
      if (table === "platform_invoices") {
        return chain({ data: [], error: null });
      }
      if (table === "leads") {
        return countChain(3);
      }
      return chain({ data: [], error: null });
    });
  });

  it("renders brand view with monitoring and backend action", async () => {
    renderDetail("demo");
    expect(await screen.findByText("Performance (last 30 days)")).toBeDefined();
    expect(screen.getByRole("button", { name: "Open brand backend" })).toBeDefined();
  });

  it("regression_uuid_brand_url_redirects_to_slug_path", async () => {
    renderDetail("a0000000-0000-4000-8000-000000000001");
    expect(await screen.findByText("Performance (last 30 days)")).toBeDefined();
  });

  it("regression_brand_detail_omits_overview_metadata", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            id: "b1",
            slug: "abacusworld",
            name: "Abacus World",
            status: "active",
            logo_url: "https://example.com/logo.png",
            created_at: "2026-06-02T00:19:17.000Z",
            updated_at: "2026-06-05T09:06:45.000Z",
          },
          error: null,
        });
      }
      if (table === "franchise_centers") {
        return chain({ data: [], error: null });
      }
      if (table === "domain_mappings") {
        return chain({
          data: [{ hostname: "abacusworld.localhost", portal_type: "brand", is_primary: true }],
          error: null,
        });
      }
      if (table === "brand_subscriptions") {
        return chain({ data: null, error: null });
      }
      return countChain(0);
    });

    renderDetail("abacusworld");
    expect(await screen.findByText("Performance (last 30 days)")).toBeDefined();
    expect(screen.queryByText("Overview")).toBeNull();
    expect(screen.queryByText(/Created /)).toBeNull();
    expect(screen.queryByText(/Backend URL:/)).toBeNull();
    expect(document.querySelector(".ed-brand-detail__logo")?.getAttribute("src")).toBe("https://example.com/logo.png");
  });
});
