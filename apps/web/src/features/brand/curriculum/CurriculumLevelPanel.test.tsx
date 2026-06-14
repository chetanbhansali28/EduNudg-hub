import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurriculumLevelPanel } from "./CurriculumLevelPanel";

vi.mock("@/features/brand/curriculum/CurriculumUnitsPanel", () => ({
  CurriculumUnitsPanel: () => <div>Chapters</div>,
}));

const levelCloser = { bindClose: vi.fn(), closeAddForm: vi.fn() };

const levels = [
  {
    id: "l1",
    name: "Level 1",
    sort_order: 1,
    abacus_level_code: "L1",
    topics_covered: [],
    why_take: null,
    what_you_learn: null,
    marketing_video_url: null,
  },
  {
    id: "l2",
    name: "Level 2",
    sort_order: 2,
    abacus_level_code: "L2",
    topics_covered: [],
    why_take: null,
    what_you_learn: null,
    marketing_video_url: null,
  },
];

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe("CurriculumLevelPanel", () => {
  it("regression_programs_render_as_accordion_without_edit_button", () => {
    wrap(
      <CurriculumLevelPanel
        brandId="brand-1"
        levels={levels}
        unitCounts={{ l1: 2, l2: 0 }}
        canEdit
        selectedLevelId={null}
        onSelectLevel={vi.fn()}
        addLevel={{ name: "", code: "", topics: "", whyTake: "", whatYouLearn: "", videoUrl: "" }}
        onAddLevelChange={vi.fn()}
        editLevel={{ name: "", code: "", topics: "", whyTake: "", whatYouLearn: "", videoUrl: "" }}
        onEditLevelChange={vi.fn()}
        onCreateLevel={vi.fn()}
        createPending={false}
        onUpdateLevel={vi.fn()}
        updatePending={false}
        onDeleteLevel={vi.fn()}
        onReorderLevels={vi.fn()}
        reorderPending={false}
        onError={vi.fn()}
        levelCloser={levelCloser}
      />
    );

    expect(screen.getByText("Programs")).toBeDefined();
    expect(document.querySelector(".ed-curriculum-level-accordion")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "Delete" }).length).toBe(2);
  });

  it("regression_expanded_accordion_shows_inline_program_fields_and_chapters", () => {
    wrap(
      <CurriculumLevelPanel
        brandId="brand-1"
        levels={levels}
        unitCounts={{ l1: 1 }}
        canEdit
        selectedLevelId="l1"
        onSelectLevel={vi.fn()}
        addLevel={{ name: "", code: "", topics: "", whyTake: "", whatYouLearn: "", videoUrl: "" }}
        onAddLevelChange={vi.fn()}
        editLevel={{ name: "Level 1", code: "L1", topics: "", whyTake: "", whatYouLearn: "", videoUrl: "" }}
        onEditLevelChange={vi.fn()}
        onCreateLevel={vi.fn()}
        createPending={false}
        onUpdateLevel={vi.fn()}
        updatePending={false}
        onDeleteLevel={vi.fn()}
        onReorderLevels={vi.fn()}
        reorderPending={false}
        onError={vi.fn()}
        levelCloser={levelCloser}
      />
    );

    expect(screen.getByLabelText("Program name")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save program" })).toBeDefined();
    expect(screen.getByText("Chapters")).toBeDefined();
  });
});
