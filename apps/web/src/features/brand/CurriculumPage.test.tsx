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
const rpcMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({ from: fromMock, rpc: rpcMock }),
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

const sampleDraftVersion = {
  id: "v1",
  program_id: "p1",
  version_number: 1,
  status: "draft" as const,
  published_at: null,
};

const samplePublishedVersion = {
  id: "v1",
  program_id: "p1",
  version_number: 1,
  status: "published" as const,
  published_at: "2026-01-01T00:00:00Z",
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

function mockCurriculumTables(options?: { publishedOnly?: boolean }) {
  const version = options?.publishedOnly ? samplePublishedVersion : sampleDraftVersion;
  fromMock.mockImplementation((table: string) => {
    if (table === "programs") return chain([sampleProgram]);
    if (table === "curriculum_versions") return chain([version]);
    if (table === "levels") return chain([sampleLevel]);
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
    expect(screen.getByText(/Select a course to manage levels/i)).toBeDefined();
  });

  it("shows master-detail with publish toggle for draft course", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Publication status" })).toBeDefined();
      expect(screen.getByText(/Draft — not yet live/i)).toBeDefined();
    });

    expect(screen.getByText("Courses")).toBeDefined();
    expect(screen.getByText("Levels")).toBeDefined();
  });

  it("regression_live_only_shows_create_draft_banner", async () => {
    mockCurriculumTables({ publishedOnly: true });
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/Create draft to edit/i)).toBeDefined();
    });

    expect(screen.getByText(/Live on website/i)).toBeDefined();
    expect(screen.queryByRole("button", { name: "Add level" })).toBeNull();
  });

  it("shows units panel when level selected in draft mode", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => expect(screen.getByRole("button", { name: /Level 1/i })).toBeDefined());

    fireEvent.click(screen.getByRole("button", { name: /Level 1/i }));

    await waitFor(() => {
      expect(screen.getByText("Units")).toBeDefined();
      expect(screen.getByRole("button", { name: "Add unit" })).toBeDefined();
    });
  });
});
