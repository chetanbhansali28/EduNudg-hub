import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CenterStudentAssessmentPanel } from "./CenterStudentAssessmentPanel";
import type { CenterStudentRow } from "@/lib/centerStudentsApi";

vi.mock("@/lib/centerStudentProgramApi", () => ({
  fetchCenterStudentProgramContext: vi.fn().mockResolvedValue({
    enrollment_id: "e1",
    program_id: "p1",
    program_name: "Abacus Basics",
    starting_level_id: "l1",
    starting_level_name: "Level 1",
    current_level_id: "l2",
    current_level_name: "Level 2",
    levels: [
      { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", abacus_level_code: "L1" },
      { level_id: "l2", name: "Level 2", sort_order: 2, status: "in_progress", abacus_level_code: "L2" },
      { level_id: "l3", name: "Level 3", sort_order: 3, status: "not_started", abacus_level_code: "L3" },
    ],
  }),
}));

vi.mock("@/lib/centerAssessmentsApi", () => ({
  listStudentAssessments: vi.fn().mockResolvedValue([
    {
      id: "a1",
      student_id: "s1",
      assessment_type: "Level 1",
      score: 90,
      max_score: 100,
      assessed_at: "2026-02-01T10:00:00Z",
      notes: null,
      passed: true,
      level_id: "l1",
      program_id: "p1",
      levels: { name: "Level 1" },
      programs: { name: "Abacus Basics" },
    },
  ]),
  recordStudentAssessment: vi.fn(),
}));

const student: CenterStudentRow = {
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
};

describe("CenterStudentAssessmentPanel", () => {
  it("regression_shows_program_progress_and_all_levels_in_type_dropdown", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterStudentAssessmentPanel student={student} centerId="center-1" />
      </QueryClientProvider>
    );

    expect(await screen.findByRole("heading", { name: "Alex Student" })).toBeDefined();
    expect(await screen.findByText("Course / program")).toBeDefined();
    expect(screen.getAllByText(/Level 1 \(L1\)/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Assessment history")).toBeNull();
    const typeSelect = await screen.findByLabelText("Type");
    expect(typeSelect).toBeDefined();
    expect((typeSelect as HTMLSelectElement).value).toBe("l1");
    expect(screen.getByRole("button", { name: "Save assessment" })).toBeDefined();
  });

  it("regression_prepopulates_recorded_level_when_selected", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterStudentAssessmentPanel student={student} centerId="center-1" />
      </QueryClientProvider>
    );

    const scoreInput = await screen.findByLabelText("Score");
    await waitFor(() => {
      expect((scoreInput as HTMLInputElement).value).toBe("90");
    });
    expect((screen.getByLabelText("Max score") as HTMLInputElement).value).toBe("100");
    expect((screen.getByLabelText("Result") as HTMLSelectElement).value).toBe("pass");
  });

  it("regression_clears_form_when_selecting_unrecorded_level", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterStudentAssessmentPanel student={student} centerId="center-1" />
      </QueryClientProvider>
    );

    const typeSelect = await screen.findByLabelText("Type");
    fireEvent.change(typeSelect, { target: { value: "l2" } });

    await waitFor(() => {
      expect((screen.getByLabelText("Score") as HTMLInputElement).value).toBe("");
      expect((screen.getByLabelText("Result") as HTMLSelectElement).value).toBe("");
    });
  });

  it("regression_allows_typing_score_fields", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <CenterStudentAssessmentPanel student={student} centerId="center-1" />
      </QueryClientProvider>
    );

    const typeSelect = await screen.findByLabelText("Type");
    fireEvent.change(typeSelect, { target: { value: "l2" } });

    const scoreInput = await screen.findByLabelText("Score");
    fireEvent.change(scoreInput, { target: { value: "85" } });

    await waitFor(() => {
      expect((scoreInput as HTMLInputElement).value).toBe("85");
    });

    const maxScoreInput = screen.getByLabelText("Max score");
    fireEvent.change(maxScoreInput, { target: { value: "100" } });

    await waitFor(() => {
      expect((maxScoreInput as HTMLInputElement).value).toBe("100");
    });
  });
});
