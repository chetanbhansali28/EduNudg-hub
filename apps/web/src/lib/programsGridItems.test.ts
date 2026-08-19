import { describe, expect, it } from "vitest";
import { mergeAbacusClassicLandingConfig } from "./brandLandingDefaults";
import {
  resolveProgramsGridItems,
  programsGridHasContent,
  restrictProgramsSectionToEnabledCurriculum,
  resolveSparkCoursePrograms,
  sparkShouldShowCoursesSection,
} from "./programsGridItems";
import type { PublicCurriculumProgram } from "./brandCurriculumPublic";

function sampleCurriculum(name: string): PublicCurriculumProgram {
  return {
    id: null,
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

  it("fills missing homepage card images from matching curriculum programs", () => {
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
      [
        {
          ...sampleCurriculum("Abacus"),
          marketingImageUrl: "https://cdn.example/abacus.jpg",
        },
      ]
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.name).toBe("Abacus");
    expect(items[0]?.imageUrl).toBe("https://cdn.example/abacus.jpg");
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

describe("restrictProgramsSectionToEnabledCurriculum", () => {
  it("regression_center_public_programs_keep_only_enabled_named_cards", () => {
    const section = mergeAbacusClassicLandingConfig("Smart Brain Abacus").programsSection;
    const restricted = restrictProgramsSectionToEnabledCurriculum(section, [
      sampleCurriculum("Abacus (Mental Math)"),
    ]);
    expect(restricted?.cards?.map((card) => card.name)).toEqual(["Abacus (Mental Math)"]);
    expect(resolveProgramsGridItems(restricted, [sampleCurriculum("Abacus (Mental Math)")])).toHaveLength(1);
  });

  it("regression_center_public_programs_fall_back_to_enabled_curriculum_when_names_differ", () => {
    const section = mergeAbacusClassicLandingConfig("Smart Brain Abacus").programsSection;
    const enabled = [sampleCurriculum("Junior Abacus")];
    const restricted = restrictProgramsSectionToEnabledCurriculum(section, enabled);
    expect(restricted?.cards).toEqual([]);
    expect(resolveProgramsGridItems(restricted, enabled).map((item) => item.name)).toEqual(["Junior Abacus"]);
  });
});

describe("programsGridHasContent", () => {
  it("is true when defaults include program cards", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    expect(programsGridHasContent(config.programsSection, [])).toBe(true);
    expect(config.programsSection?.cards).toHaveLength(3);
  });
});

describe("resolveSparkCoursePrograms", () => {
  it("regression_spark_courses_prefer_published_curriculum_over_homepage_cards", () => {
    const section = mergeAbacusClassicLandingConfig("Smart Brain Abacus").programsSection;
    const courses = resolveSparkCoursePrograms(section, [
      {
        ...sampleCurriculum("Junior Abacus Path"),
        description: "From published syllabus",
        levels: [
          {
            name: "Level 1",
            levelCode: "L1",
            topicsCovered: ["Addition"],
            whyTake: null,
            whatYouLearn: null,
            marketingVideoUrl: null,
            modules: [],
          },
        ],
      },
    ]);

    expect(courses).toHaveLength(1);
    expect(courses[0]?.name).toBe("Junior Abacus Path");
    expect(courses[0]?.description).toBe("From published syllabus");
    expect(courses[0]?.levels).toHaveLength(1);
    expect(courses.map((course) => course.name)).not.toContain("Abacus (Mental Math)");
  });

  it("regression_spark_courses_fill_missing_banner_from_matching_homepage_card", () => {
    const courses = resolveSparkCoursePrograms(
      {
        cards: [
          {
            id: "a",
            name: "Junior Abacus Path",
            description: "Homepage blurb",
            imageUrl: "https://cdn.example/card.jpg",
          },
        ],
      },
      [sampleCurriculum("Junior Abacus Path")]
    );

    expect(courses[0]?.marketingImageUrl).toBe("https://cdn.example/card.jpg");
    expect(courses[0]?.description).toBe("From curriculum");
  });

  it("falls back to homepage cards when no published curriculum exists", () => {
    const section = mergeAbacusClassicLandingConfig("Smart Brain Abacus").programsSection;
    const courses = resolveSparkCoursePrograms(section, []);
    expect(courses.map((course) => course.name)).toEqual([
      "Abacus (Mental Math)",
      "Vedic Mathematics",
      "Handwriting",
    ]);
  });
});

describe("sparkShouldShowCoursesSection", () => {
  it("regression_spark_courses_show_published_syllabus_even_if_programs_grid_off", () => {
    expect(sparkShouldShowCoursesSection(false, false, 3, 3)).toBe(true);
    expect(sparkShouldShowCoursesSection(false, true, 0, 2)).toBe(true);
    expect(sparkShouldShowCoursesSection(true, false, 0, 2)).toBe(true);
    expect(sparkShouldShowCoursesSection(false, false, 0, 2)).toBe(false);
    expect(sparkShouldShowCoursesSection(true, true, 0, 0)).toBe(false);
  });
});
