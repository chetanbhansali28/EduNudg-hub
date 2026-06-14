import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { StudentHomePage } from "@/features/learn/StudentHomePage";
import { StudentEnrollmentBlockedPage } from "@/features/learn/StudentEnrollmentBlockedPage";
import { StudentLearnRpcError } from "@/lib/studentLearnApi";

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

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockHome = {
  student: {
    id: "s1",
    full_name: "Asha Kumar",
    student_code: "STU-001",
    date_of_birth: "2015-01-01",
    profile: { school_name: "Demo School", city: "Bengaluru", pincode: "560001" },
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
  upcoming_competitions: [
    {
      id: "comp-free",
      name: "Regional Challenge",
      event_date: "2026-08-01",
      location: "Bengaluru",
      registration_opens_at: null,
      registration_closes_at: null,
      fee_type: "free" as const,
      fee_amount: null,
      fee_currency: "INR",
      registration_status: "open",
      my_registration_status: "none",
      can_enroll: true,
      enroll_blocked_reason: null,
    },
    {
      id: "comp-paid",
      name: "National Championship",
      event_date: "2026-09-01",
      location: "Mumbai",
      registration_opens_at: null,
      registration_closes_at: null,
      fee_type: "paid" as const,
      fee_amount: 500,
      fee_currency: "INR",
      registration_status: "open",
      my_registration_status: "none",
      can_enroll: false,
      enroll_blocked_reason: "paid_coming_soon",
    },
  ],
  my_registrations: [],
  recent_results: [{ competition_name: "Winter Open", event_date: "2025-12-01", result_rank: "2nd", rank_position: 2, score: 90 }],
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
        { level_id: "l1", name: "Level 1", sort_order: 1, status: "completed", completed_at: null, abacus_level_code: "L1" },
        { level_id: "l2", name: "Level 2", sort_order: 2, status: "in_progress", completed_at: null, abacus_level_code: "L2" },
        { level_id: "l3", name: "Level 3", sort_order: 3, status: "not_started", completed_at: null, abacus_level_code: "L3" },
      ],
    },
    assessments: [],
  },
];

describe("StudentHomePage", () => {
  beforeEach(() => {
    fetchStudentLearnHome.mockReset();
    fetchStudentOpenBatches.mockResolvedValue([
      {
        batch_id: "b1",
        name: "Morning batch",
        program_name: "Abacus Core",
        level_start: "Level 1",
        level_end: "Level 3",
        already_joined: true,
      },
    ]);
    fetchStudentProgramLadders.mockResolvedValue(mockLadders);
  });

  it("regression_dashboard_shows_batch_carousel_and_learning_path", async () => {
    fetchStudentLearnHome.mockResolvedValue(mockHome);
    wrap(<StudentHomePage />);

    expect(await screen.findByText("Join a batch")).toBeDefined();
    expect(screen.queryByRole("link", { name: /View progress/i })).toBeNull();
    expect(screen.getByText("Enrolled")).toBeDefined();
    expect(screen.getByText("Your learning path")).toBeDefined();
    expect(screen.getByText("Current program")).toBeDefined();
    expect(screen.getByText("Level 2")).toBeDefined();
    expect(screen.queryByText("My center")).toBeNull();
    expect(screen.queryByText("Recent activity")).toBeNull();
    expect(screen.queryByText("Quick shortcuts")).toBeNull();
    expect(screen.getByText("Upcoming competitions")).toBeDefined();
  });

  it("regression_paid_competition_shows_coming_soon", async () => {
    fetchStudentLearnHome.mockResolvedValue(mockHome);
    wrap(<StudentHomePage />);
    expect(await screen.findByText("National Championship")).toBeDefined();
    expect(screen.getAllByRole("button", { name: /Coming soon/i }).length).toBeGreaterThan(0);
  });
});

describe("StudentEnrollmentBlockedPage", () => {
  it("regression_no_active_enrollment_blocked_message", () => {
    wrap(<StudentEnrollmentBlockedPage brandName="Abacus World" />);
    expect(screen.getByText(/not linked to an active center enrollment/i)).toBeDefined();
  });
});

describe("StudentLearnRpcError", () => {
  it("carries error code", () => {
    const err = new StudentLearnRpcError("NO_ACTIVE_ENROLLMENT");
    expect(err.code).toBe("NO_ACTIVE_ENROLLMENT");
  });
});
