import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogCurriculumMeta } from "./CatalogCurriculumMeta";

describe("CatalogCurriculumMeta", () => {
  it("regression_center_sku_shows_curriculum_and_program", () => {
    render(<CatalogCurriculumMeta courseNames={["Abacus Core"]} levelNames={["Level 1"]} />);
    expect(screen.getByText("Curriculum: Abacus Core")).toBeDefined();
    expect(screen.getByText("Program: Level 1")).toBeDefined();
  });

  it("uses the course name as Program when no level is tagged", () => {
    render(<CatalogCurriculumMeta courseNames={["Abacus Core"]} levelNames={[]} />);
    expect(screen.getByText("Curriculum: Abacus Core")).toBeDefined();
    expect(screen.getByText("Program: Abacus Core")).toBeDefined();
  });

  it("renders nothing without curriculum links", () => {
    const { container } = render(<CatalogCurriculumMeta courseNames={[]} levelNames={[]} />);
    expect(container.querySelector(".ed-catalog-curriculum")).toBeNull();
  });
});
