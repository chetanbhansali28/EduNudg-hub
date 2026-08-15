import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurriculumPage } from "./CurriculumPage";
import { exactAccessibleName } from "@/test/exactAccessibleName";

vi.mock("./hooks/useBrandScope", () => ({
  useBrandScope: () => ({ brandId: "brand-1", brandSlug: "abacus", missingBrand: false }),
}));

vi.mock("@/features/center/hooks/useOpsBreakpoint", () => ({
  useOpsBreakpoint: () => ({ isDesktop: true, isMobile: false }),
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
  name: "Abacus",
  description: "Desc",
  why_take: "Parents want faster mental math",
  what_you_learn: "Anzan, visualization, and confidence",
  marketing_video_url: null,
  marketing_image_url: null,
  age_label: "Level 1 to 8",
  marketing_benefits: ["Faster mental math"],
  scholarship_highlight: "1 Lakh Success Scholarship!",
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
  program_id: "p1",
};

function mockCurriculumTables() {
  fromMock.mockImplementation((table: string) => {
    if (table === "programs") return chain([sampleProgram]);
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
    </QueryClientProvider>
  );
}

describe("CurriculumPage", () => {
  it("shows empty course list message", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "programs") return chain([]);
      return chain([]);
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/No courses yet/i)).toBeDefined();
    });
    expect(screen.getByText(/Select a course to manage programs/i)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Curriculum" })).toBeDefined();
  });

  it("shows curriculum builder layout for active course", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Abacus")).toBeDefined();
    });

    expect(screen.getByText(/Courses \(1\)/)).toBeDefined();
    expect(screen.getByText("Programs Structure")).toBeDefined();
    expect(screen.getByLabelText("Course Name")).toBeDefined();
    expect(screen.getByRole("button", { name: exactAccessibleName("Save") })).toBeDefined();
    expect(screen.getByText(/Marketing copy and structure for the core Abacus course/i)).toBeDefined();
    const detailTitle = document.querySelector(".ed-curriculum-editor-hero__title") as HTMLElement | null;
    expect(detailTitle).toBeTruthy();
    expect(detailTitle?.textContent).toContain("Abacus");
  });

  it("regression_curriculum_detail_title_uses_half_width", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(document.querySelector(".ed-curriculum-editor-hero__title")).toBeTruthy();
    });

    const title = document.querySelector(".ed-curriculum-editor-hero__title") as HTMLElement;
    expect(title.className).toContain("ed-curriculum-editor-hero__title");
    expect(title.parentElement?.className).toContain("ed-curriculum-editor-hero__title-row");
  });

  it("regression_curriculum_detail_save_group_aligns_right", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(document.querySelector(".ed-curriculum-editor-hero__meta")).toBeTruthy();
    });

    const meta = document.querySelector(".ed-curriculum-editor-hero__meta") as HTMLElement;
    expect(meta.contains(screen.getByRole("switch", { name: "Turn Abacus off" }))).toBe(true);
    expect(meta.contains(screen.getByRole("button", { name: exactAccessibleName("Save") }))).toBe(true);
  });

  it("regression_curriculum_banner_shows_upload_size_hint", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getAllByText("Course Banner (Thumbnail)").length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/Maximum 5 MB/i)).toBeDefined();
    expect(screen.getByText(/1280×720/)).toBeDefined();
    expect(screen.getByText(/PNG, JPEG, WebP, or GIF/i)).toBeDefined();
  });

  it("regression_desktop_add_course_opens_create_form", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "+ Add Curriculum" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Add Curriculum" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Add course" })).toBeDefined();
      expect(screen.getByLabelText("Course name")).toBeDefined();
      expect(screen.getByRole("button", { name: "Create course" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Add benefit" })).toBeDefined();
      expect(screen.getByLabelText("Why parents choose this")).toBeDefined();
      expect(screen.getByLabelText("Skills and outcomes")).toBeDefined();
    });
  });

  it("regression_courses_list_has_no_add_plus_button", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "+ Add Curriculum" })).toBeDefined();
    });

    expect(screen.queryByRole("button", { name: "Add course" })).toBeNull();
    expect(document.querySelector(".ed-curriculum-brand__add-btn")).toBeNull();
  });

  it("regression_created_course_shows_parent_marketing_fields", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Benefits & outcomes" })).toBeDefined();
    });

    expect(screen.getByLabelText("Why parents choose this")).toBeDefined();
    expect(screen.getByLabelText("Skills and outcomes")).toBeDefined();
    expect(screen.getByRole("button", { name: "Add benefit" })).toBeDefined();
    expect(screen.getByDisplayValue("Parents want faster mental math")).toBeDefined();
    expect(screen.getByDisplayValue("Anzan, visualization, and confidence")).toBeDefined();
    expect(screen.getByDisplayValue("Faster mental math")).toBeDefined();
    expect(screen.getByDisplayValue("1 Lakh Success Scholarship!")).toBeDefined();
    expect(screen.getByRole("button", { name: exactAccessibleName("Save") })).toBeDefined();
  });

  it("regression_created_course_parent_marketing_is_editable", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Why parents choose this")).toBeDefined();
    });

    fireEvent.change(screen.getByLabelText("Why parents choose this"), {
      target: { value: "Updated parent reason" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add benefit" }));

    expect(screen.getByDisplayValue("Updated parent reason")).toBeDefined();
    expect(screen.getByLabelText("Benefit 2")).toBeDefined();
    expect((screen.getByRole("button", { name: exactAccessibleName("Save") }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("shows chapters panel when program accordion expanded", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => expect(screen.getByText("Programs Structure")).toBeDefined());

    const programRow = document.querySelector(".ed-curriculum-program-outline") as HTMLButtonElement;
    fireEvent.click(programRow);

    await waitFor(() => {
      expect(screen.getByText("Chapters")).toBeDefined();
      expect(screen.getByRole("button", { name: "Add chapter" })).toBeDefined();
      expect(screen.getByRole("button", { name: "Save program" })).toBeDefined();
    });
  });

  it("regression_curriculum_course_live_toggle_is_visible", async () => {
    mockCurriculumTables();
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("switch", { name: "Turn Abacus off" })).toBeDefined();
    });

    const editorToggle = screen.getByRole("switch", { name: "Turn Abacus off" });
    expect(editorToggle.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: exactAccessibleName("Save") })).toBeDefined();
    expect(screen.getAllByRole("switch")).toHaveLength(1);
  });

  it("regression_curriculum_course_live_toggle_turns_course_off", async () => {
    const programsApi = chain([sampleProgram]);
    fromMock.mockImplementation((table: string) => {
      if (table === "programs") return programsApi;
      if (table === "levels") return chain([sampleLevel]);
      if (table === "center_program_enablement") return chain(null, { count: 0 });
      if (table === "batches") return chain(null, { count: 0 });
      if (table === "modules") return chain([]);
      if (table === "lessons") return chain([]);
      return chain([]);
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("switch", { name: "Turn Abacus off" })).toBeDefined();
    });

    fireEvent.click(screen.getByRole("switch", { name: "Turn Abacus off" }));
    await waitFor(() => {
      expect(programsApi.update).toHaveBeenCalledWith({ is_active: false });
    });
  });

  it("regression_curriculum_page_matches_franchise_apps_stats_chrome", async () => {
    mockCurriculumTables();
    const { container } = renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Curriculum" })).toBeDefined();
      expect(screen.getByText("Abacus")).toBeDefined();
    });

    await waitFor(() => {
      const kpiValues = [...container.querySelectorAll(".ed-lead-kpi__value")].map((el) => el.textContent);
      expect(kpiValues).toEqual(["1", "0", "1", "1"]);
    });

    expect(screen.getByText(/educational blueprint/i)).toBeDefined();
    expect(screen.getByRole("button", { name: "+ Add Curriculum" })).toBeDefined();
    expect(screen.getByPlaceholderText("Search courses...")).toBeDefined();
    expect(screen.getByRole("tablist", { name: "Course filter" })).toBeDefined();
    const kpiLabels = [...container.querySelectorAll(".ed-lead-kpi__label")].map((el) => el.textContent);
    expect(kpiLabels).toEqual(["Active", "Drafts", "Programs", "Total"]);
    expect(document.querySelector(".ed-pipeline-workspace")).toBeTruthy();
    expect(document.querySelector(".ed-pipeline-page-header")).toBeTruthy();

    fireEvent.click(container.querySelectorAll(".ed-lead-kpi")[1]!);
    expect(screen.getByRole("tab", { name: /Drafts \(0\)/ }).getAttribute("aria-selected")).toBe("true");
  });
});
