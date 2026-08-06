import { describe, expect, it } from "vitest";
import { createPublicCurriculumProgram, parsePublicCurriculum } from "./brandCurriculumPublic";

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

describe("parsePublicCurriculum", () => {
  it("reads snake_case rpc rows", () => {
    const [program] = parsePublicCurriculum([
      {
        name: "Abacus",
        marketing_image_url: "https://cdn.example/banner.png",
        age_label: "6-14",
        marketing_benefits: ["Speed"],
        levels: [],
      },
    ]);
    expect(program?.marketingImageUrl).toBe("https://cdn.example/banner.png");
    expect(program?.ageLabel).toBe("6-14");
    expect(program?.marketingBenefits).toEqual(["Speed"]);
  });

  it("regression_preserves_camelCase_when_normalize_reparses_bundle", () => {
    const alreadyParsed = [
      createPublicCurriculumProgram({
        name: "Abacus",
        marketingImageUrl: "https://cdn.example/banner.png",
        ageLabel: "6-14",
        marketingBenefits: ["Speed"],
        versionNumber: 2,
      }),
    ];
    const [program] = parsePublicCurriculum(alreadyParsed);
    expect(program?.marketingImageUrl).toBe("https://cdn.example/banner.png");
    expect(program?.ageLabel).toBe("6-14");
    expect(program?.marketingBenefits).toEqual(["Speed"]);
    expect(program?.versionNumber).toBe(2);
  });
});
