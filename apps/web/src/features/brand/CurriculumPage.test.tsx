import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurriculumPage } from "./CurriculumPage";

vi.mock("./hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", missingBrand: false }),
}));

vi.mock("@/features/platform/hooks/useMutationError", () => ({
  useMutationError: () => ({ error: null, clear: vi.fn(), capture: vi.fn() }),
}));

const fromMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock, rpc: vi.fn() }),
}));

function chain(data: unknown, opts?: { count?: number }) {
  const result = { data, error: null, count: opts?.count ?? null };
  const api = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    is: vi.fn(() => api),
    in: vi.fn(() => api),
    order: vi.fn(() => api),
    insert: vi.fn(() => api),
    update: vi.fn(() => api),
    delete: vi.fn(() => api),
    single: vi.fn(async () => result),
    then: (resolve: (v: typeof result) => void) => resolve(result),
  };
  return api;
}

const sampleProgram = {
  id: "p1",
  name: "Junior Track",
  description: "Desc",
  why_take: "Why",
  what_you_learn: "What",
  marketing_video_url: null,
  marketing_image_url: null,
  age_label: "Age 6–10",
  marketing_benefits: [],
  scholarship_highlight: null,
  is_active: true,
};

const sampleLevel = {
  id: "l1",
  name: "Level 1",
  sort_order: 1,
  abacus_level_code: "L1",
  topics_covered: ["Finger basics"],
  why_take: "Start here",
  what_you_learn: "Basics",
  marketing_video_url: null,
};

function mockCurriculumTables() {
  fromMock.mockImplementation((table: string) => {
    if (table === "programs") return chain([sampleProgram]);
    if (table === "levels") return chain([{ ...sampleLevel, program_id: "p1" }]);
    if (table === "center_program_enablement") return chain(null, { count: 0 });
    if (table === "batches") return chain(null, { count: 0 });
    if (table === "modules") return chain([]);
    if (table === "lessons") return chain([]);
    return chain([]);
  });
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CurriculumPage />
    </QueryClientProvider>,
  );
}

describe("CurriculumPage", () => {
  it("shows empty course list with add course action", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "programs") return chain([]);
      return chain([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No courses yet/i)).toBeDefined();
    });
    expect(screen.getByRole("button", { name: "Add course" })).toBeDefined();
    expect(screen.getByText(/Select a course to manage programs/i)).toBeDefined();
  });

  it("shows master-detail with programs for active course", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add program" })).toBeDefined();
    });

    expect(screen.getByText("Courses")).toBeDefined();
    expect(screen.getByText("Programs")).toBeDefined();
  });

  it("shows chapters panel when program accordion expanded", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: "Add program" })).toBeDefined());

    const trigger = document.querySelector(".ed-curriculum-level-accordion__trigger") as HTMLButtonElement;
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText("Chapters")).toBeDefined();
      expect(screen.getByRole("button", { name: "Add chapter" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Save program" })).toBeDefined();
    });
  });
});
