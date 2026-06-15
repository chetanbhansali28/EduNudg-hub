import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterAssessmentsPage } from "./CenterAssessmentsPage";

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({
    portalType: "center",
    brandId: "brand-1",
    centerId: "center-1",
    brandSlug: "abacus",
    centerSlug: "koramangala",
    hostname: "koramangala.abacus.localhost",
  }),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
}));

vi.mock("@/lib/centerStudentsApi", () => ({
  fetchCenterStudents: vi.fn().mockResolvedValue([
    {
      id: "s1",
      full_name: "Alex Student",
      student_code: "STU001",
      login_email: "alex@example.com",
      user_id: "u1",
      enrollment_id: "e1",
      enrollment_status: "active",
      enrollment_created_at: "2026-01-01T00:00:00Z",
      program_id: "p1",
      program_name: "Abacus Basics",
      starting_level_id: "l1",
      starting_level_name: "Level 1",
      batch_ids: [],
      batch_names: [],
    },
  ]),
}));

vi.mock("@/lib/centerStudentProgramApi", () => ({
  fetchCenterStudentProgramContext: vi.fn().mockResolvedValue({
    enrollment_id: "e1",
    program_id: "p1",
    program_name: "Abacus Basics",
    starting_level_id: "l1",
    starting_level_name: "Level 1",
    current_level_id: "l1",
    current_level_name: "Level 1",
    levels: [{ level_id: "l1", name: "Level 1", sort_order: 1, status: "in_progress", abacus_level_code: null }],
  }),
}));

vi.mock("@/lib/centerAssessmentsApi", () => ({
  listStudentAssessments: vi.fn().mockResolvedValue([]),
  recordStudentAssessment: vi.fn(),
}));

describe("CenterAssessmentsPage", () => {
  it("regression_renders_student_list_and_assessment_detail", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={qc}>
          <CenterAssessmentsPage />
        </QueryClientProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "Assessments" })).toBeDefined();
    expect(screen.getByText(/past evaluations, and record level checks/i)).toBeDefined();
    expect(screen.getByPlaceholderText(/Search by student name or ID/i)).toBeDefined();
    expect(await screen.findByText("Enrolled students")).toBeDefined();
    await waitFor(() => {
      expect(screen.getByText("ACTIVE: 1")).toBeDefined();
    });
    expect(await screen.findByRole("heading", { name: "Alex Student", level: 2 })).toBeDefined();
    expect(await screen.findByText("Record assessment")).toBeDefined();
  });
});
