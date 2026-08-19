import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { PublicCoursePage } from "./PublicCoursePage";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import { mergeSparkAcademyLandingConfig } from "@/lib/brandLandingDefaults";
import { createPublicCurriculumProgram } from "@/lib/brandCurriculumPublic";
import type { BrandLandingOutletContext } from "@/features/brand/BrandPublicLayout";

function CourseRoute({
  ctx,
  path,
}: {
  ctx: BrandLandingOutletContext;
  path: string;
}) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <LeadModalProvider>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route element={<Outlet context={ctx} />}>
            <Route path="/courses/:slug" element={<PublicCoursePage />} />
          </Route>
        </Routes>
      </LeadModalProvider>
    </MemoryRouter>
  );
}

function ctx(overrides?: Partial<BrandLandingOutletContext>): BrandLandingOutletContext {
  const published = createPublicCurriculumProgram({
    name: "Junior Abacus Path",
    whyTake: "Build number sense early",
  });
  return {
    config: mergeSparkAcademyLandingConfig("Spark Brand"),
    brandSlug: "spark-brand",
    marketingTheme: "spark-academy",
    publicCurriculum: [published],
    publicStats: { centersCount: 0, studentsCount: 0 },
    legalPages: {},
    socialConnect: {},
    ...overrides,
  };
}

describe("PublicCoursePage", () => {
  const originalScrollTo = window.scrollTo;

  beforeEach(() => {
    window.scrollTo = vi.fn() as typeof window.scrollTo;
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
  });

  it("renders the matching published course", () => {
    render(<CourseRoute ctx={ctx()} path="/courses/junior-abacus-path" />);
    expect(screen.getByRole("heading", { level: 1, name: "Junior Abacus Path" })).toBeDefined();
    expect(screen.getByText("Build number sense early")).toBeDefined();
  });

  it("regression_unknown_course_slug_redirects_home", () => {
    render(<CourseRoute ctx={ctx()} path="/courses/not-a-real-course" />);
    expect(screen.getByText("Home page")).toBeDefined();
  });

  it("regression_center_course_page_uses_enabled_curriculum", () => {
    const enabled = createPublicCurriculumProgram({ name: "Center Abacus" });
    render(
      <CourseRoute
        ctx={ctx({ publicCurriculum: [enabled] })}
        path="/courses/brand-only-course"
      />
    );
    expect(screen.getByText("Home page")).toBeDefined();
  });
});
