import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterReportsPage } from "./CenterReportsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    brandId: "brand-1",
    centerId: "88241abc-def0-1234-5678-90abcdef1234",
    brandSlug: "abacus",
    centerSlug: "koramangala",
    hostname: "koramangala.abacusworld.localhost",
  }),
}));

vi.mock("@/hooks/usePortalBranding", () => ({
  usePortalBranding: () => ({
    data: { centerName: "Koramangala Center" },
  }),
}));

vi.mock("@/lib/centerReportsApi", () => ({
  fetchCenterOpsReport: vi.fn().mockResolvedValue({
    active_enrollments: 42,
    open_leads: 8,
    converted_leads: 12,
    assessments_30d: 6,
    recent_assessments: [],
  }),
}));

vi.mock("@/lib/centerAssessmentsApi", () => ({
  listCenterAssessments: vi.fn().mockResolvedValue([
    {
      id: "a1",
      student_id: "s1",
      assessment_type: "level_check",
      score: 92,
      max_score: 100,
      assessed_at: "2026-06-01T10:00:00Z",
      notes: null,
      passed: true,
      level_id: "l2",
      program_id: "p1",
      students: { full_name: "Priya Sharma" },
      levels: { name: "Level 2" },
      programs: { name: "Abacus Basics" },
    },
    {
      id: "a2",
      student_id: "s2",
      assessment_type: "level_check",
      score: 55,
      max_score: 100,
      assessed_at: "2026-05-28T14:00:00Z",
      notes: null,
      passed: false,
      level_id: "l1",
      program_id: "p1",
      students: { full_name: "Arjun Patel" },
      levels: { name: "Level 1" },
      programs: { name: "Abacus Basics" },
    },
  ]),
}));

function renderReportsPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <CenterReportsPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe("CenterReportsPage", () => {
  it("regression_renders_reports_heading_and_kpi_cards", async () => {
    renderReportsPage();

    expect(screen.getByRole("heading", { name: "Reports", level: 1 })).toBeDefined();
    expect(screen.getByText(/operational health and student progress/i)).toBeDefined();
    expect(screen.getByText(/Koramangala Center • ID:/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText("20 Total Leads")).toBeDefined();
    });
    expect(screen.getByText("42 Active Students")).toBeDefined();
    expect(screen.getByText("6 Assessments Recorded")).toBeDefined();
    expect(screen.getAllByText("Active Pipeline").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enrollment Health").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Assessment Velocity").length).toBeGreaterThan(0);
  });

  it("renders_recent_assessments_table_with_status_badges", async () => {
    renderReportsPage();

    expect(await screen.findByRole("columnheader", { name: "Student" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Course/Level" })).toBeDefined();
    expect(screen.getAllByText("Priya Sharma").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Arjun Patel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Level 2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("92/100").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Passed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs Review").length).toBeGreaterThan(0);
  });

  it("renders_sidebar_pipeline_health_and_quick_actions", async () => {
    renderReportsPage();

    await waitFor(() => {
      expect(screen.getByText("60%")).toBeDefined();
    });
    expect(screen.getByRole("heading", { name: "Pipeline Health", level: 3 })).toBeDefined();
    expect(screen.getByText("Leads Generated")).toBeDefined();
    expect(screen.getByText("Export CSV")).toBeDefined();
    expect(screen.getByText("Scale Your Center")).toBeDefined();
    const viewAllLink = screen.getByRole("link", { name: "View All Assessments" });
    expect(viewAllLink.getAttribute("href")).toBe("/app/assessments");
  });

  it("toggles_assessment_sort_order", async () => {
    renderReportsPage();

    await waitFor(() => {
      expect(screen.getAllByText("Priya Sharma").length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole("button", { name: /Sort ↓/i }));
    expect(screen.getByRole("button", { name: /Sort ↑/i })).toBeDefined();
  });
});
