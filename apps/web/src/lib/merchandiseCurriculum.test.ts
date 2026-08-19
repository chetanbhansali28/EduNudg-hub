import { describe, expect, it } from "vitest";
import {
  catalogCurriculumLabel,
  catalogFormNeedsCurriculum,
  catalogHasCurriculum,
  catalogLinkDisplayName,
  catalogVisibleToCenter,
  filterCatalogForCenter,
  toggleLevelSelection,
  toggleProgramSelection,
  formatCenterSkuCurriculum,
  uniqueProgramIds,
} from "./merchandiseCurriculum";

describe("merchandiseCurriculum", () => {
  it("regression_unassigned_sku_is_hidden_from_center", () => {
    expect(catalogVisibleToCenter([], ["prog-a"])).toBe(false);
    expect(catalogHasCurriculum([])).toBe(false);
    expect(catalogFormNeedsCurriculum(true, [])).toBe(true);
    expect(catalogFormNeedsCurriculum(false, [])).toBe(false);
  });

  it("regression_sku_visible_when_center_has_matching_curriculum", () => {
    expect(catalogVisibleToCenter(["prog-a", "prog-b"], ["prog-b"])).toBe(true);
    expect(catalogVisibleToCenter(["prog-a"], ["prog-c"])).toBe(false);
  });

  it("regression_filter_catalog_for_center_drops_other_courses", () => {
    const items = [
      { id: "kit-1", programIds: ["abacus"] },
      { id: "kit-2", programIds: ["vedic"] },
      { id: "kit-3", programIds: [] },
    ];
    expect(filterCatalogForCenter(items, ["abacus"]).map((item) => item.id)).toEqual(["kit-1"]);
  });

  it("labels missing curriculum for brand editors", () => {
    expect(catalogCurriculumLabel([])).toMatch(/hidden from franchise shops/i);
    expect(catalogCurriculumLabel(["Abacus Core"])).toBe("Curriculum: Abacus Core");
    expect(catalogCurriculumLabel(["Abacus Core · Level 1"])).toBe("Curriculum: Abacus Core · Level 1");
  });

  it("regression_merchandise_curriculum_includes_program_level_tag", () => {
    expect(catalogLinkDisplayName("Abacus Core", "Level 1")).toBe("Abacus Core · Level 1");
    expect(uniqueProgramIds([
      { programId: "prog-1", levelId: "lvl-1" },
      { programId: "prog-1", levelId: "lvl-2" },
    ])).toEqual(["prog-1"]);
  });

  it("regression_center_sku_curriculum_separates_course_and_level", () => {
    expect(formatCenterSkuCurriculum(["Abacus Core"], ["Level 1"])).toEqual({
      curriculum: "Abacus Core",
      program: "Level 1",
    });
    expect(formatCenterSkuCurriculum(["Abacus Core"], [])).toEqual({
      curriculum: "Abacus Core",
      program: "Abacus Core",
    });
    expect(formatCenterSkuCurriculum([], [])).toEqual({ curriculum: null, program: null });
  });

  it("regression_merchandise_picker_toggles_program_levels", () => {
    const program = {
      id: "prog-1",
      name: "Abacus Core",
      levels: [
        { id: "lvl-1", name: "Level 1", sortOrder: 1 },
        { id: "lvl-2", name: "Level 2", sortOrder: 2 },
      ],
    };
    const all = toggleProgramSelection([], program);
    expect(all).toEqual([
      { programId: "prog-1", levelId: "lvl-1" },
      { programId: "prog-1", levelId: "lvl-2" },
    ]);
    expect(toggleLevelSelection(all, "prog-1", "lvl-1")).toEqual([{ programId: "prog-1", levelId: "lvl-2" }]);
    expect(toggleProgramSelection([{ programId: "prog-1", levelId: null }], program)).toEqual([]);
  });
});
