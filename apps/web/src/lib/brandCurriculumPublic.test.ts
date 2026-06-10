import { describe, expect, it } from "vitest";
import { createPublicCurriculumProgram } from "./brandCurriculumPublic";

describe("createPublicCurriculumProgram", () => {
  it("regression_includes_marketing_fields_from_migration_042", () => {
    const program = createPublicCurriculumProgram({ name: "Junior Abacus" });
    expect(program.marketingImageUrl).toBeNull();
    expect(program.ageLabel).toBeNull();
    expect(program.marketingBenefits).toEqual([]);
    expect(program.scholarshipHighlight).toBeNull();
  });

  it("merges overrides", () => {
    const program = createPublicCurriculumProgram({
      name: "Senior",
      ageLabel: "Age 8–14",
      marketingBenefits: ["Speed", "Focus"],
    });
    expect(program.ageLabel).toBe("Age 8–14");
    expect(program.marketingBenefits).toEqual(["Speed", "Focus"]);
  });
});
