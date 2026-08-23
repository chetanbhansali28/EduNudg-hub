import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  mergeAbacusClassicLandingConfig,
  mergeEduLearnLandingConfig,
  mergeSparkAcademyLandingConfig,
} from "@/lib/brandLandingDefaults";
import { AbacusClassicEditorForm } from "./AbacusClassicEditorForm";
import type { MarketingTheme } from "@/types/homepage";

const cases: { theme: MarketingTheme; config: ReturnType<typeof mergeAbacusClassicLandingConfig> }[] = [
  { theme: "abacus-classic", config: mergeAbacusClassicLandingConfig("Smart Brain") },
  { theme: "spark-academy", config: mergeSparkAcademyLandingConfig("Spark") },
  { theme: "edu-learn", config: mergeEduLearnLandingConfig("EduLearn") },
];

describe("AbacusClassicEditorForm curriculum accordions", () => {
  it.each(cases)(
    "regression_homepage_hides_courses_and_curriculum_syllabus_editors_$theme",
    ({ theme, config }) => {
      render(
        <AbacusClassicEditorForm
          config={config}
          marketingTheme={theme}
          portalMode="brand"
          onChange={() => undefined}
        />,
      );

      expect(screen.queryByText("Courses designed for success")).toBeNull();
      expect(screen.queryByText("Programs grid")).toBeNull();
      expect(screen.queryByText("Curriculum syllabus")).toBeNull();
      expect(screen.queryByRole("button", { name: /\+ Add program card/i })).toBeNull();
      expect(screen.getByText("Hero")).toBeDefined();
      expect(screen.getByText("Site")).toBeDefined();
    },
  );
});
