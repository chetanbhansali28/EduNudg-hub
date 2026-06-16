import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrandDashboard } from "./BrandDashboard";
import { BrandDashboardView } from "./dashboard/BrandDashboardView";
import type { BrandDashboardHome } from "@/lib/brandDashboardHomeApi";

vi.mock("@/features/brand/hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
}));

vi.mock("@/hooks/useStaffProfile", () => ({
  useStaffProfile: () => ({ name: "Director Patel", email: "director@example.com" }),
}));

const sampleHome: BrandDashboardHome = {
  unassignedLeads: 12,
  unassignedLeadsTrend: 12,
  pendingFranchiseApps: 4,
  staleLeads: 8,
  revenueTotalCents: 120_000_000_00,
  revenueTrendPercent: 18,
  revenueBars: [0.4, 0.45, 0.5, 0.55, 0.65, 0.8, 1],
  centerHealthPercent: 92,
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
};

vi.mock("@/lib/brandDashboardHomeApi", () => ({
  fetchBrandDashboardHome: vi.fn().mockResolvedValue(sampleHome),
}));

describe("BrandDashboard", () => {
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
    expect(screen.getByText(/Good morning, Director/i)).toBeDefined();
    expect(screen.getByText("Unassigned Leads")).toBeDefined();
    expect(screen.getByText("Franchise Apps")).toBeDefined();
    expect(screen.getAllByText("Stale Leads (>48h)").length).toBeGreaterThan(0);
    expect(screen.getByText("Recent Activity")).toBeDefined();
    expect(screen.getByText("Bright Minds Academy")).toBeDefined();
    expect(screen.getAllByText("Revenue Outlook").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Center Health").length).toBeGreaterThan(0);
    expect(screen.getByText("Expansion Goals")).toBeDefined();
    expect(screen.getByText("Network Distribution")).toBeDefined();
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

    expect(screen.getByRole("link", { name: "+ New Center Proposal" }).getAttribute("href")).toBe(
      "/app/franchise-applications"
    );
    expect(screen.getByText("₹1.2Cr")).toBeDefined();
    expect(screen.getByText("+18% vs LW")).toBeDefined();
    expect(screen.getByText("LC")).toBeDefined();
    expect(screen.getByText("+14")).toBeDefined();
    expect(screen.getByText("142 Active Hubs • 12 Pending")).toBeDefined();
  });
});
