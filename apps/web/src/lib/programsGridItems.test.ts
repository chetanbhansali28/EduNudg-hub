import { describe, expect, it } from "vitest";
import { mergeAbacusClassicLandingConfig } from "./brandLandingDefaults";
import {
  resolveProgramsGridItems,
  programsGridHasContent,
} from "./programsGridItems";
import type { PublicCurriculumProgram } from "./brandCurriculumPublic";

function sampleCurriculum(name: string): PublicCurriculumProgram {
  return {
    name,
    description: "From curriculum",
    whyTake: null,
    whatYouLearn: null,
    marketingVideoUrl: null,
    marketingImageUrl: null,
    ageLabel: null,
    marketingBenefits: [],
    scholarshipHighlight: null,
    versionNumber: 1,
    levels: [],
  };
}

describe("resolveProgramsGridItems", () => {
  it("uses homepage cards when configured", () => {
    const items = resolveProgramsGridItems(
      {
        cards: [
          {
            id: "a",
            name: "Abacus",
            description: "Homepage blurb",
            ageLabel: "Age 6–14",
            benefits: ["Fast math"],
          },
        ],
      },
      [sampleCurriculum("Curriculum Only")]
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Abacus");
    expect(items[0]?.description).toBe("Homepage blurb");
    expect(items[0]?.benefits).toEqual(["Fast math"]);
  });

  it("falls back to curriculum when no homepage cards", () => {
    const items = resolveProgramsGridItems(undefined, [sampleCurriculum("Junior Abacus")]);
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Junior Abacus");
  });

  it("falls back to curriculum when homepage cards are empty", () => {
    const items = resolveProgramsGridItems({ cards: [] }, [sampleCurriculum("Junior Abacus")]);
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Junior Abacus");
  });

  it("ignores homepage cards without a name", () => {
    const items = resolveProgramsGridItems(
      { cards: [{ id: "blank", name: "  ", description: "Ignored" }] },
      [sampleCurriculum("Junior Abacus")]
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Junior Abacus");
  });
});

describe("programsGridHasContent", () => {
  it("is true when defaults include program cards", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(programsGridHasContent(config.programsSection, [])).toBe(true);
    expect(config.programsSection?.cards).toHaveLength(3);
  });
});
