import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MerchandiseCurriculumPicker } from "./MerchandiseCurriculumPicker";

describe("MerchandiseCurriculumPicker", () => {
  it("regression_merchandise_curriculum_picker_toggles_course", () => {
    const onChange = vi.fn();
    render(
      <MerchandiseCurriculumPicker
        programs={[
          { id: "prog-1", name: "Abacus Core", levels: [] },
          { id: "prog-2", name: "Vedic Math", levels: [] },
        ]}
        selectedLinks={[{ programId: "prog-1", levelId: null }]}
        onChange={onChange}
      />
    );
    expect(screen.getByRole("button", { name: "✓ Abacus Core" }).getAttribute("aria-pressed")).toBe("true");
    screen.getByRole("button", { name: "Vedic Math" }).click();
    expect(onChange).toHaveBeenCalledWith([
      { programId: "prog-1", levelId: null },
      { programId: "prog-2", levelId: null },
    ]);
  });

  it("regression_merchandise_curriculum_picker_toggles_level", () => {
    const onChange = vi.fn();
    render(
      <MerchandiseCurriculumPicker
        programs={[
          {
            id: "prog-1",
            name: "Abacus Core",
            levels: [
              { id: "lvl-1", name: "Level 1", sortOrder: 1 },
              { id: "lvl-2", name: "Level 2", sortOrder: 2 },
            ],
          },
        ]}
        selectedLinks={[{ programId: "prog-1", levelId: "lvl-1" }]}
        onChange={onChange}
      />
    );
    expect(screen.getByRole("group", { name: "Abacus Core levels" })).toBeDefined();
    expect(screen.getByRole("button", { name: "✓ Level 1" }).getAttribute("aria-pressed")).toBe("true");
    screen.getByRole("button", { name: "Level 2" }).click();
    expect(onChange).toHaveBeenCalledWith([
      { programId: "prog-1", levelId: "lvl-1" },
      { programId: "prog-1", levelId: "lvl-2" },
    ]);
  });
});
