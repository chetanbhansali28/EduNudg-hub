import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandDetailPage } from "./BrandDetailPage";

const fromMock = vi.fn();

const { updateBrandMarketingThemeMock } = vi.hoisted(() => ({
  updateBrandMarketingThemeMock: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/brandLandingApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/brandLandingApi")>();
  return {
    ...actual,
    updateBrandMarketingTheme: (...args: unknown[]) => updateBrandMarketingThemeMock(...args),
  };
});

vi.mock("@/lib/brandOwnerCredentialsApi", () => ({
  fetchBrandOwnerLoginEmail: vi.fn().mockResolvedValue("owner@demo.com"),
  upsertBrandOwnerCredentials: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("./PortalOpenButton", () => ({
  PortalOpenButton: ({ label = "Open" }: { label?: string }) => (
    <button type="button">{label}</button>
  ),
}));

vi.mock("@/lib/brandSlug", () => ({
  uniqueBrandSlug: vi.fn().mockResolvedValue("demo"),
}));

function chain(result: { data: unknown; error: unknown; count?: number }) {
  const c = {
    select: vi.fn(() => c),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    in: vi.fn(() => c),
    gte: vi.fn(() => c),
    order: vi.fn(() => Promise.resolve(result)),
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
    updateBrandMarketingThemeMock.mockReset();
    updateBrandMarketingThemeMock.mockResolvedValue(undefined);
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            id: "b1",
            slug: "demo",
            name: "Demo Brand",
            status: "active",
            logo_url: null,
            marketing_theme: "novu",
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
      if (table === "brand_settings") {
        return chain({
          data: {
            id: "settings-1",
            settings: { features: { student_leads: true, merchandise: false } },
          },
          error: null,
        });
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
    expect(screen.getByText("Brand settings")).toBeDefined();
    expect(screen.queryByText("Marketing theme")).toBeNull();
    expect(screen.getByLabelText("Website theme")).toBeDefined();
  });

  it("regression_uuid_brand_url_redirects_to_slug_path", async () => {
    renderDetail("a0000000-0000-4000-8000-000000000001");
    expect(await screen.findByText("Performance (last 30 days)")).toBeDefined();
  });

  it("regression_brand_detail_omits_duplicate_summary_kpis", async () => {
    renderDetail("demo");
    expect(await screen.findByText("Performance (last 30 days)")).toBeDefined();
    expect(await screen.findByText("Centers")).toBeDefined();
    expect(screen.queryByText("Centers listed")).toBeNull();
    expect(screen.queryByText("Brand portal")).toBeNull();
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

  it("regression_brand_settings_form_on_detail_page", async () => {
    renderDetail("demo");
    expect(await screen.findByText("Brand settings")).toBeDefined();
    expect(screen.getByLabelText("Name")).toBeDefined();
    expect(screen.getByLabelText("Status")).toBeDefined();
    expect(screen.getByLabelText("Login email")).toBeDefined();
    expect(screen.getByLabelText("Password")).toBeDefined();
    expect(screen.getByLabelText("Website theme")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDefined();
    expect(screen.queryByLabelText("Slug")).toBeNull();
  });

  it("regression_brand_settings_saves_marketing_theme", async () => {
    renderDetail("demo");
    const themeSelect = await screen.findByLabelText("Website theme");
    fireEvent.change(themeSelect, { target: { value: "abacus-classic" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateBrandMarketingThemeMock).toHaveBeenCalledWith("b1", "abacus-classic");
    });
  });

  it("regression_platform_brand_detail_includes_features_section", async () => {
    renderDetail("demo");
    expect(await screen.findByText("Features")).toBeDefined();
    expect(screen.getByText("Merchandise catalog & orders")).toBeDefined();
    expect(
      screen.getByText("Control which modules are active for this brand's portal and franchise centers.")
    ).toBeDefined();
  });

  it("regression_domains_section_shows_open_for_all_portal_types", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "brands") {
        return chain({
          data: {
            id: "b1",
            slug: "smart-brain-abacus",
            name: "Smart Brain Abacus",
            status: "active",
            logo_url: null,
            marketing_theme: "novu",
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
          data: [
            { hostname: "smart-brain-abacus.localhost", portal_type: "brand", is_primary: true },
            { hostname: "koramangala.smart-brain-abacus.localhost", portal_type: "center", is_primary: true },
            { hostname: "learn.smart-brain-abacus.localhost", portal_type: "learn", is_primary: false },
          ],
          error: null,
        });
      }
      if (table === "brand_subscriptions") {
        return chain({ data: null, error: null });
      }
      return countChain(0);
    });

    renderDetail("smart-brain-abacus");
    expect(await screen.findByText(/learn\.smart-brain-abacus\.localhost/)).toBeDefined();
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Open" })).toHaveLength(3);
    });
  });
});
