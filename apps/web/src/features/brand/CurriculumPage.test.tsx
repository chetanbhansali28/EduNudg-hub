import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurriculumPage } from "./CurriculumPage";

vi.mock("./hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", missingBrand: false }),
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
    if (table === "modules") return chain([{ id: "m1", title: "Getting started", sort_order: 1 }]);
    if (table === "lessons") {
      return chain([
        { id: "ls1", title: "Welcome", content_type: "article", duration_minutes: 30, sort_order: 1 },
      ]);
    }
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
  it("regression_shows_where_program_and_version_data_is_stored", () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "programs") return chain([]);
      return chain([]);
    });

    renderPage();

    expect(screen.getByText(/Manage the full curriculum tree in five layers/i)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Programs (programs)" })).toBeDefined();
    expect(screen.getByText(/curriculum_versions/i)).toBeDefined();
  });

  it("regression_edit_form_actions_render_at_bottom_not_beside_fields", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "programs") return chain([{ ...sampleProgram, name: "Level 1" }]);
      return chain([]);
    });

    renderPage();

    expect(await screen.findByText("Level 1")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    const save = screen.getByRole("button", { name: "Save" });
    expect(save.closest(".ed-form-actions")).toBeTruthy();
    expect(save.closest(".ed-list-row__aside")).toBeNull();
  });

  it("regression_reveals_full_curriculum_hierarchy_for_selected_program", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Curriculum structure")).toBeDefined();
      expect(screen.getByText("Versions (curriculum_versions)")).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByText("Levels (levels)")).toBeDefined();
      expect(screen.getByText("Modules (modules)")).toBeDefined();
      expect(screen.getByText("Lessons (lessons)")).toBeDefined();
    });

    expect(screen.getByLabelText("Version (curriculum_versions)")).toBeDefined();
    expect(await screen.findByText("Welcome")).toBeDefined();
  });
});
