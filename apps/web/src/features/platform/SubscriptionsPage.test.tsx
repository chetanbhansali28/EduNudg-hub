import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@edunudg/ui";
import { SubscriptionsPage } from "./SubscriptionsPage";

import { STARTER_PLAN_FEATURES, GROWTH_PLAN_FEATURES } from "@/lib/subscriptionPlanFeatures";

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: fromMock,
  }),
}));

vi.mock("@/lib/platformAuditApi", () => ({
  logPlatformAudit: vi.fn(),
}));

function chain(result: { data: unknown; error: unknown }) {
  const c = {
    select: vi.fn(() => c),
    insert: vi.fn(() => c),
    update: vi.fn(() => c),
    delete: vi.fn(() => c),
    eq: vi.fn(() => c),
    is: vi.fn(() => c),
    order: vi.fn(() => Promise.resolve(result)),
  };
  return c;
}

function renderSubs() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <SubscriptionsPage />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("SubscriptionsPageView module", () => {
  it("regression_subscriptions_page_view_parses_without_duplicate_imports", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");

    const filePath = path.join(path.dirname(fileURLToPath(import.meta.url)), "SubscriptionsPageView.tsx");
    const source = fs.readFileSync(filePath, "utf8");
    const uiImport = source.match(/import\s*\{([\s\S]*?)\}\s*from\s*["']@edunudg\/ui["']/);
    expect(uiImport).toBeTruthy();

    const names = uiImport![1]!
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    expect(duplicates).toEqual([]);

    await expect(import("./SubscriptionsPageView")).resolves.toMatchObject({
      SubscriptionsPageView: expect.any(Function),
    });
  });
});

describe("SubscriptionsPage", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation((table: string) => {
      if (table === "subscription_plans") {
        return chain({
          data: [
            {
              id: "p1",
              code: "starter",
              name: "Starter",
              price_cents: 999900,
              currency: "INR",
              billing_interval: "month",
              is_active: true,
              is_default: true,
              features: STARTER_PLAN_FEATURES,
            },
            {
              id: "p2",
              code: "growth",
              name: "Growth",
              price_cents: 1999900,
              currency: "INR",
              billing_interval: "month",
              is_active: true,
              is_default: false,
              features: GROWTH_PLAN_FEATURES,
            },
          ],
          error: null,
        });
      }
      if (table === "brand_subscriptions") {
        return chain({ data: [], error: null });
      }
      if (table === "brands") {
        return chain({ data: [{ id: "b1", name: "Demo" }], error: null });
      }
      return chain({ data: [], error: null });
    });
  });

  it("renders plans with CRUD controls", async () => {
    renderSubs();
    const createPlanButton = await screen.findByRole("button", { name: "Create plan" });
    expect(createPlanButton.classList.contains("ed-sub-primary-btn")).toBe(true);
    expect(screen.getAllByText("Available Plans").length).toBeGreaterThan(0);
    await screen.findAllByRole("button", { name: "Edit Plan" });
    expect(screen.getAllByRole("button", { name: "Edit Plan" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/₹9,999\.00/).length).toBeGreaterThan(0);
    expect(document.querySelector(".ed-sub-plan-grid")).toBeTruthy();
    const featuredCards = document.querySelectorAll(".ed-sub-only-desktop .ed-sub-plan-card--featured");
    expect(featuredCards).toHaveLength(1);
    expect(featuredCards[0]?.textContent).toContain("GROWTH");
  });

  it("regression_create_plan_scrolls_to_form_with_footer_actions", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    renderSubs();
    fireEvent.click(await screen.findByRole("button", { name: "Create plan" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Create plan" }).length).toBeGreaterThan(1);
  });

  it("regression_subscriptions_page_has_assign_subscription_form", async () => {
    renderSubs();
    expect(await screen.findByRole("button", { name: "Assign subscription" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Assign plan" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Assign subscription" }));
    expect(screen.getByRole("button", { name: "Assign plan" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDefined();
  });

  it("regression_assign_subscription_scrolls_to_form", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0);
      return 0;
    });

    renderSubs();
    fireEvent.click(await screen.findByRole("button", { name: "Assign subscription" }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("regression_subscriptions_omits_filter_and_list_controls_until_eleven_rows", async () => {
    renderSubs();
    await screen.findAllByRole("button", { name: "Edit Plan" });
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
    expect(screen.queryByPlaceholderText("Search brands…")).toBeNull();
  });

  it("regression_subscriptions_shows_list_controls_for_large_lists", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "subscription_plans") {
        return chain({ data: [], error: null });
      }
      if (table === "brand_subscriptions") {
        return chain({
          data: Array.from({ length: 11 }, (_, index) => ({
            id: `s${index}`,
            brand_id: `b${index}`,
            plan_id: "p1",
            status: "active",
            brands: { name: `Brand ${index}` },
            subscription_plans: { name: "Growth" },
          })),
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: [{ id: "b1", name: "Demo Brand" }], error: null });
      }
      return chain({ data: [], error: null });
    });

    renderSubs();
    await screen.findAllByPlaceholderText("Search brands…");
    expect(screen.getAllByText("1–10 of 11").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Filter" })).toBeNull();
  });

  it("regression_brand_subscriptions_use_table_layout", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "subscription_plans") {
        return chain({ data: [], error: null });
      }
      if (table === "brand_subscriptions") {
        return chain({
          data: [
            {
              id: "s1",
              brand_id: "b1",
              plan_id: "p1",
              status: "active",
              brands: { name: "Demo Brand" },
              subscription_plans: { name: "Growth" },
            },
          ],
          error: null,
        });
      }
      if (table === "brands") {
        return chain({ data: [{ id: "b1", name: "Demo Brand" }], error: null });
      }
      return chain({ data: [], error: null });
    });
    renderSubs();
    expect(await screen.findAllByText("Demo Brand")).toHaveLength(2);
    expect(document.querySelector(".ed-sub-table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Brand" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Current plan" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Status" })).toBeDefined();
  });
});
