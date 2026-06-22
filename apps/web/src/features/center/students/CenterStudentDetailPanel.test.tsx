import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterStudentDetailPanel } from "./CenterStudentDetailPanel";

vi.mock("@/lib/studentPortalAdminApi", () => ({
  inviteStudentPortalAccess: vi.fn(),
  pinEnrollmentProgram: vi.fn(),
}));

vi.mock("@/lib/centerStudentProgramApi", () => ({
  fetchCenterStudentProgramContext: vi.fn().mockResolvedValue({
    enrollment_id: "e1",
    program_id: "p1",
    program_name: "Abacus Core",
    starting_level_id: "l1",
    starting_level_name: "Level 1",
    current_level_id: "l1",
    current_level_name: "Level 1",
    levels: [{ level_id: "l1", name: "Level 1", sort_order: 1, status: "in_progress", abacus_level_code: "L1" }],
  }),
}));

vi.mock("@/lib/centerBatchesApi", () => ({
  fetchAuthorizedPrograms: vi.fn().mockResolvedValue([{ id: "p1", name: "Abacus Core" }]),
  fetchCenterBatches: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/studentProfileApi", () => ({
  fetchStudentProfileAddress: vi.fn().mockResolvedValue({
    address_line1: "12 Main Road",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    phone: "+91 98765 43210",
  }),
  upsertStudentDeliveryAddress: vi.fn(),
}));

vi.mock("@/lib/centerStudentsApi", () => ({
  syncStudentBatchAssignments: vi.fn(),
}));

vi.mock("@/lib/curriculumApi", () => ({
  fetchLevels: vi.fn().mockResolvedValue([
    { id: "l1", name: "Level 1", sort_order: 1, abacus_level_code: "L1" },
  ]),
}));

vi.mock("@/lib/centerAssessmentsApi", () => ({
  listStudentAssessments: vi.fn().mockResolvedValue([]),
  recordStudentAssessment: vi.fn(),
}));

const student = {
  id: "s1",
  full_name: "Asha Kumar",
  student_code: "STU-1",
  login_email: null,
  user_id: null,
  enrollment_id: "e1",
  enrollment_status: "active",
  enrollment_created_at: "2023-10-01T00:00:00.000Z",
  program_id: null,
  program_name: null,
  starting_level_id: null,
  starting_level_name: null,
  batch_ids: [],
  batch_names: [],
};

describe("CenterStudentDetailPanel", () => {
  beforeEach(() => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterStudentDetailPanel student={student} brandId="brand-1" centerId="center-1" />
      </QueryClientProvider>
    );
  });

  it("regression_shows_course_program_enrollment_section", () => {
    expect(screen.getByText("Course / program")).toBeDefined();
    expect(screen.getByRole("button", { name: "Update assignment" })).toBeDefined();
    expect(screen.getAllByText(/Starting level/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Active enrollment/i)).toBeDefined();
  });

  it("regression_assessments_tab_shows_record_form", async () => {
    fireEvent.click(screen.getByRole("tab", { name: /Assessments/i }));
    await waitFor(() => {
      expect(screen.getByText("Record assessment")).toBeDefined();
    });
    expect(screen.getByRole("button", { name: "Save assessment" })).toBeDefined();
  });

  it("regression_delivery_phone_is_dialable", async () => {
    await waitFor(() => {
      expect(screen.getByLabelText("Phone").getAttribute("value")).toBe("+91 98765 43210");
    });
    const dial = await screen.findByRole("link", { name: "Call +91 98765 43210" });
    expect(dial.getAttribute("href")).toBe("tel:+919876543210");
  });
});
