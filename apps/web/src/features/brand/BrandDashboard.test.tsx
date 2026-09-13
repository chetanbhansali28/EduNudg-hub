import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandDashboard } from "./BrandDashboard";
import { BrandDashboardView } from "./dashboard/BrandDashboardView";
import type { BrandDashboardHome } from "@/lib/brandDashboardHomeApi";
import { buildCenterHealthScore } from "@/lib/brandDashboardHelpers";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/hooks/useStaffProfile", () => ({
  useStaffProfile: () => ({ name: "Director Patel", email: "director@example.com" }),
}));

vi.mock("@/bootstrap/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

function completeCenterHealth() {
  return buildCenterHealthScore({
    curriculumCount: 1,
    feedbackCount: 2,
    studentCount: 2,
    franchiseCount: 2,
    homepageSet: true,
    centerSiteSet: true,
  });
}

function incompleteCenterHealth() {
  return buildCenterHealthScore({
    curriculumCount: 1,
    feedbackCount: 1,
    studentCount: 2,
    franchiseCount: 1,
    homepageSet: true,
    centerSiteSet: false,
  });
}

const { fetchBrandDashboardHome } = vi.hoisted(() => ({
  fetchBrandDashboardHome: vi.fn(),
}));

const sampleHome = {
  unassignedLeads: 12,
  unassignedLeadsTrend: 12,
  pendingFranchiseApps: 4,
  staleLeads: 8,
  revenueTotalCents: 1_200_000_000,
  revenueTrendPercent: 18,
  revenueBars: [0.4, 0.45, 0.5, 0.55, 0.65, 0.8, 1],
  centerHealthPercent: completeCenterHealth().percent,
  centerHealthChecks: completeCenterHealth().checks,
  activeCenters: 142,
  pendingCenters: 12,
  centerAvatars: [
    { initials: "LC", tone: "blue" },
    { initials: "KM", tone: "purple" },
    { initials: "PJ", tone: "teal" },
  ],
  extraCenterCount: 14,
  activities: [
    {
      id: "a1",
      kind: "application",
      title: "New Application: Bright Minds Academy",
      subtitle: "Regional Hub • San Francisco, CA",
      href: "/app/franchise-applications",
      occurredAt: "2026-06-15T09:58:00Z",
    },
    {
      id: "a2",
      kind: "lead",
      title: "Lead Alert: High Interest",
      subtitle: "Contact: James Wilson • Mumbai",
      href: "/app/leads",
      occurredAt: "2026-06-15T09:45:00Z",
    },
  ],
  expansionGoals: [
    { id: "Delhi NCR", label: "Delhi NCR", percent: 85 },
    { id: "Mumbai Metro", label: "Mumbai Metro", percent: 62 },
  ],
} satisfies BrandDashboardHome;

vi.mock("@/lib/brandDashboardHomeApi", () => ({
  fetchBrandDashboardHome,
}));

describe("BrandDashboard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    fetchBrandDashboardHome.mockReset();
    fetchBrandDashboardHome.mockResolvedValue(sampleHome);
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });
  });

  it("regression_brand_home_today_at_a_glance", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandDashboard />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Today at a glance", level: 1 })).toBeDefined();
    expect(screen.getAllByText(/Good (morning|afternoon|evening), Director/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Unassigned Leads")).toBeDefined();
    expect(screen.getByText("Franchise Apps")).toBeDefined();
    expect(screen.getAllByText("Stale Leads (>48h)").length).toBeGreaterThan(0);
    expect(screen.getByText("Recent Activity")).toBeDefined();
    expect(screen.getByText(/Bright Minds Academy/i)).toBeDefined();
    expect(screen.getAllByText("Revenue Outlook").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Center Health").length).toBeGreaterThan(0);
    expect(screen.getByText("Expansion Goals")).toBeDefined();
    expect(screen.getByText("Network Distribution")).toBeDefined();
    expect(screen.queryByRole("heading", { name: "Finish Center Health setup" })).toBeNull();
  });

  it("regression_center_health_login_popup_opens_when_setup_incomplete", async () => {
    const incomplete = incompleteCenterHealth();
    fetchBrandDashboardHome.mockResolvedValue({
      ...sampleHome,
      centerHealthPercent: incomplete.percent,
      centerHealthChecks: incomplete.checks,
    });
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <BrandDashboard />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Finish Center Health setup" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Got it" })).toBeDefined();
  });
});

describe("BrandDashboardView", () => {
  it("renders desktop proposal cta and health avatars", () => {
    render(
      <MemoryRouter>
        <BrandDashboardView
          data={sampleHome}
          displayName="Director Patel"
          nowMs={new Date("2026-06-15T10:00:00Z").getTime()}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "+ New Franchise" }).getAttribute("href")).toBe(
      "/app/franchise-applications"
    );
    expect(screen.getAllByText("₹1.2Cr").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+18% vs LW").length).toBeGreaterThan(0);
    expect(screen.getAllByText("LC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+14").length).toBeGreaterThan(0);
    expect(screen.getByText("142 Active Hubs • 12 Pending")).toBeDefined();
    expect(screen.getAllByText("100% setup complete. All checks passed.").length).toBeGreaterThan(0);
  });

  it("regression_center_health_lists_missing_setup_reasons", () => {
    const incomplete = incompleteCenterHealth();
    render(
      <MemoryRouter>
        <BrandDashboardView
          data={{
            ...sampleHome,
            centerHealthPercent: incomplete.percent,
            centerHealthChecks: incomplete.checks,
          }}
          displayName="Director Patel"
          nowMs={new Date("2026-06-15T10:00:00Z").getTime()}
        />
      </MemoryRouter>
    );

    expect(screen.getAllByText("50% setup complete. Each check is equally weighted.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Curriculum 1 of 1").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Add 1 more feedback (1 of 2)" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Add 1 more franchise (1 of 2)" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Students 2 of 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Homepage content is set").length).toBeGreaterThan(0);
    const centerSiteLinks = screen.getAllByRole("link", { name: "Set franchise site content" });
    expect(centerSiteLinks.length).toBeGreaterThan(0);
    expect(centerSiteLinks[0]?.getAttribute("href")).toBe("/app/center-site");
    expect(screen.queryByText(/operating at target margin/i)).toBeNull();
  });
});
