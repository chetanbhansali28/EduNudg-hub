import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { StudentProgressPage } from "@/features/learn/StudentProgressPage";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";

const fetchStudentProgramLadders = vi.fn();

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", brandSlug: "abacusworld" }),
}));

vi.mock("@/lib/studentProgressApi", () => ({
  fetchStudentProgramLadders: (...args: unknown[]) => fetchStudentProgramLadders(...args),
}));

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("StudentProgressPage", () => {
  beforeEach(() => {
    fetchStudentProgramLadders.mockReset();
  });

  it("regression_empty_ladders_shows_friendly_empty_state", async () => {
    fetchStudentProgramLadders.mockResolvedValue([]);
    wrap(<StudentProgressPage />);
    expect(await screen.findByText("Nothing to show yet")).toBeDefined();
    expect(screen.getByText(/No program progress yet/)).toBeDefined();
    expect(screen.getByRole("link", { name: /Back to dashboard/i })).toBeDefined();
  });

  it("regression_rpc_400_shows_graceful_error_not_blocked_page", async () => {
    fetchStudentProgramLadders.mockRejectedValue({
      message: "column a.level_id does not exist",
      details: "Bad Request",
    });
    wrap(<StudentProgressPage />);
    expect(await screen.findByText("Could not load progress")).toBeDefined();
    expect(screen.getByText(/temporarily unavailable/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Try again/i })).toBeDefined();
  });

  it("regression_no_active_enrollment_shows_blocked_page", async () => {
    fetchStudentProgramLadders.mockRejectedValue(new StudentLearnRpcError("NO_ACTIVE_ENROLLMENT"));
    wrap(<StudentProgressPage />);
    expect(await screen.findByText(/not linked to an active center enrollment/i)).toBeDefined();
  });

  it("renders ladder when progress exists", async () => {
    fetchStudentProgramLadders.mockResolvedValue([
      {
        curriculum_version_id: "cv1",
        program_id: "p1",
        program_name: "Abacus Core",
        curriculum_label: "v1 — Abacus Core",
        batches: [],
        curriculum_ladder: {
          current_level_id: "l1",
          completion_pct: 25,
          levels: [
            {
              level_id: "l1",
              name: "Level 1",
              sort_order: 1,
              status: "completed",
              completed_at: null,
              abacus_level_code: "L1",
            },
          ],
        },
        assessments: [],
      },
    ]);
    wrap(<StudentProgressPage />);
    expect(await screen.findByText("Level 1")).toBeDefined();
    expect(screen.getByText("Your programs")).toBeDefined();
  });
});
