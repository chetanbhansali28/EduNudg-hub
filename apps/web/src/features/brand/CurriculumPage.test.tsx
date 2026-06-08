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
  getSupabase: () => ({ from: fromMock }),
}));

function chain(data: unknown) {
  const result = { data, error: null };
  const api = {
    select: vi.fn(() => api),
    eq: vi.fn(() => api),
    is: vi.fn(() => api),
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
  is_active: true,
};

const sampleVersion = {
  id: "v1",
  program_id: "p1",
  version_number: 1,
  status: "draft" as const,
  published_at: null,
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
    if (table === "curriculum_versions") return chain([sampleVersion]);
    if (table === "levels") return chain([sampleLevel]);
    return chain([]);
  });
}

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <CurriculumPage />
    </QueryClientProvider>
  );
}

describe("CurriculumPage", () => {
  it("regression_shows_course_outline_without_publish_controls", () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "programs") return chain([]);
      return chain([]);
    });

    renderPage();

    expect(screen.getByText(/Manage your program and levels/i)).toBeDefined();
    expect(screen.queryByRole("link", { name: "Preview on website" })).toBeNull();
    expect(screen.queryByText(/Draft — not yet live/i)).toBeNull();
    expect(screen.queryByRole("button", { name: "Publish to website" })).toBeNull();
  });

  it("regression_course_outline_shows_level_marketing", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Course outline")).toBeDefined();
      expect(screen.getByText("Levels")).toBeDefined();
    });

    fireEvent.click(await screen.findByRole("button", { name: /Level 1/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Why this level")).toBeDefined();
      expect(screen.getByLabelText("Skills and outcomes")).toBeDefined();
    });
  });

  it("regression_no_separate_units_tab", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => expect(screen.getByText("Course outline")).toBeDefined());

    expect(screen.queryByRole("button", { name: "Website content" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Add unit" })).toBeNull();
  });
});
