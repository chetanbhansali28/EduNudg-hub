import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterStudentDetailPanel } from "./CenterStudentDetailPanel";

vi.mock("@/lib/studentPortalAdminApi", () => ({
  inviteStudentPortalAccess: vi.fn(),
  pinEnrollmentProgram: vi.fn(),
}));

vi.mock("@/lib/centerStudentProgramApi", () => ({
  fetchCenterStudentProgramContext: vi.fn().mockResolvedValue({
    enrollment_id: "e1",
    program_id: null,
    program_name: null,
    current_level_id: null,
    current_level_name: null,
    levels: [],
  }),
}));

vi.mock("@/lib/centerBatchesApi", () => ({
  fetchAuthorizedPrograms: vi.fn().mockResolvedValue([{ id: "p1", name: "Abacus Core" }]),
  fetchCenterBatches: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/studentProfileApi", () => ({
  fetchStudentProfileAddress: vi.fn().mockResolvedValue(null),
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

const student = {
  id: "s1",
  full_name: "Asha Kumar",
  student_code: "STU-1",
  login_email: null,
  user_id: null,
  enrollment_id: "e1",
  enrollment_status: "active",
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
    expect(screen.getByRole("button", { name: "Assign course" })).toBeDefined();
    expect(screen.getByText(/Starting level/i)).toBeDefined();
    expect(screen.queryByText(/begins at level 1 and advances automatically/i)).toBeNull();
  });
});
