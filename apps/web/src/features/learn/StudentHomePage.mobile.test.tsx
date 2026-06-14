import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { StudentHomePage } from "@/features/learn/StudentHomePage";

const fetchStudentLearnHome = vi.fn();
const fetchStudentOpenBatches = vi.fn();
const fetchStudentProgramLadders = vi.fn();

vi.mock("@/bootstrap/TenantProvider", () => ({
  useTenant: () => ({ brandId: "brand-1", brandSlug: "abacusworld" }),
}));

vi.mock("@/lib/studentBatchJoinApi", () => ({
  fetchStudentOpenBatches: (...args: unknown[]) => fetchStudentOpenBatches(...args),
  joinStudentBatch: vi.fn(),
}));

vi.mock("@/lib/studentProgressApi", () => ({
  fetchStudentProgramLadders: (...args: unknown[]) => fetchStudentProgramLadders(...args),
}));

vi.mock("@/lib/studentLearnApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/studentLearnApi")>();
  return {
    ...actual,
    fetchStudentLearnHome: (...args: unknown[]) => fetchStudentLearnHome(...args),
  };
});

vi.mock("@/features/learn/hooks/useStudentBreakpoint", () => ({
  useStudentBreakpoint: () => ({ isDesktop: false, isMobile: true }),
}));

const mockHome = {
  student: {
    id: "s1",
    full_name: "Asha Kumar",
    student_code: "STU-001",
    date_of_birth: "2015-01-01",
    profile: {
      school_name: "Demo School",
      city: "Bengaluru",
      pincode: "560001",
      address_line1: null,
      state: null,
      phone: null,
      photo_url: null,
    },
  },
  brand: { id: "brand-1", name: "Abacus World", logo_url: null },
  enrollment: {
    enrollment_id: "e1",
    status: "active",
    enrolled_at: new Date().toISOString(),
    center_id: "c1",
    batch_name: "Batch A",
    program_id: "p1",
    program_name: "Abacus Core",
  },
  center: {
    id: "c1",
    display_name: "Koramangala Center",
    short_description: null,
    city: "Bengaluru",
    contact_phone: "+919999999999",
    public_url: "http://koramangala.abacusworld.localhost:9000/",
  },
  curriculum_ladder: {
    current_level_id: "l2",
    completion_pct: 25,
    levels: [
      { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", completed_at: null, abacus_level_code: "L1" },
      { level_id: "l2", name: "Level 2", sort_order: 2, status: "in_progress", completed_at: null, abacus_level_code: "L2" },
    ],
  },
  stats: {
    levels_completed: 1,
    levels_total: 8,
    assessments_count: 3,
    avg_score_pct: 84.3,
    competitions_registered: 1,
    competitions_completed: 1,
  },
  upcoming_competitions: [],
  my_registrations: [],
  recent_results: [],
  recent_assessments: [],
  recent_activity: [],
  quick_actions: [],
};

const mockLadders = [
  {
    program_id: "p1",
    program_name: "Abacus Core",
    batches: [{ batch_id: "b1", batch_name: "Morning", level_start: "L1", level_end: "L3" }],
    curriculum_ladder: {
      current_level_id: "l2",
      completion_pct: 25,
      levels: [
        { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", completed_at: "2025-09-12", abacus_level_code: "L1" },
        { level_id: "l2", name: "Level 2", sort_order: 2, status: "in_progress", completed_at: null, abacus_level_code: "L2" },
        { level_id: "l3", name: "Level 3", sort_order: 3, status: "not_started", completed_at: null, abacus_level_code: "L3" },
      ],
    },
  },
];

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

describe("StudentHomePage mobile", () => {
  beforeEach(() => {
    fetchStudentLearnHome.mockReset();
    fetchStudentOpenBatches.mockResolvedValue([
      {
        batch_id: "b1",
        name: "Morning batch",
        program_name: "Abacus Core",
        level_start: "Level 1",
        level_end: "Level 3",
        already_joined: false,
      },
    ]);
    fetchStudentProgramLadders.mockResolvedValue(mockLadders);
  });

  it("regression_mobile_shows_progress_card_and_timeline", async () => {
    fetchStudentLearnHome.mockResolvedValue(mockHome);
    wrap(<StudentHomePage />);

    expect(await screen.findByText("Current progress")).toBeDefined();
    expect(screen.getByText(/Welcome back, Asha$/)).toBeDefined();
    expect(screen.getByText("Continue lesson")).toBeDefined();
    expect(screen.getByText("Join a batch")).toBeDefined();
    expect(screen.getByText("Your learning path")).toBeDefined();
    expect(screen.getByText("Current")).toBeDefined();
    expect(screen.queryByText("Recommended for you")).toBeNull();
  });
});
