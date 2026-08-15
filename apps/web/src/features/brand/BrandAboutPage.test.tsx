import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { BrandAboutPage } from "./BrandAboutPage";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import {
  mergeAbacusClassicLandingConfig,
  mergeSparkAcademyLandingConfig,
} from "@/lib/brandLandingDefaults";
import type { BrandLandingOutletContext } from "./BrandPublicLayout";

function AboutRoute({ ctx }: { ctx: BrandLandingOutletContext }) {
  return (
    <MemoryRouter initialEntries={["/about"]}>
      <LeadModalProvider>
        <Routes>
          <Route path="/" element={<div>Home page</div>} />
          <Route element={<Outlet context={ctx} />}>
            <Route path="/about" element={<BrandAboutPage />} />
          </Route>
        </Routes>
      </LeadModalProvider>
    </MemoryRouter>
  );
}

function baseCtx(
  overrides?: Partial<BrandLandingOutletContext>
): BrandLandingOutletContext {
  return {
    config: mergeAbacusClassicLandingConfig("Published Brand"),
    brandSlug: "published-brand",
    marketingTheme: "abacus-classic",
    publicCurriculum: [],
    publicStats: { centersCount: 0, studentsCount: 0 },
    legalPages: {},
    socialConnect: {},
    ...overrides,
  };
}

describe("BrandAboutPage", () => {
  it("renders_about_page_when_published", () => {
    render(<AboutRoute ctx={baseCtx()} />);
    expect(screen.getByRole("heading", { name: /WE MAKE WINNERS WHO LEAD/i })).toBeDefined();
    expect(screen.getByRole("heading", { name: /ABOUT PUBLISHED BRAND/i })).toBeDefined();
  });

  it("regression_redirects_home_when_about_unpublished", () => {
    const config = mergeAbacusClassicLandingConfig("Hidden Brand");
    config.about = { ...config.about!, publishPage: false };
    render(<AboutRoute ctx={baseCtx({ config })} />);
    expect(screen.getByText("Home page")).toBeDefined();
  });

  it("regression_spark_about_page_uses_spark_theme_classes", () => {
    render(
      <AboutRoute
        ctx={baseCtx({
          marketingTheme: "spark-academy",
          config: mergeSparkAcademyLandingConfig("Spark Brand"),
        })}
      />
    );
    const root = document.querySelector(".about-us--page");
    expect(root?.classList.contains("about-us--spark-academy")).toBe(true);
    expect(screen.getByText("About us")).toBeTruthy();
    expect(document.querySelector(".sa-btn")).toBeTruthy();
  });

  it("regression_abacus_about_page_uses_abacus_theme_classes", () => {
    render(<AboutRoute ctx={baseCtx()} />);
    const root = document.querySelector(".about-us--page");
    expect(root?.classList.contains("about-us--abacus-classic")).toBe(true);
  });

  it("regression_abacus_about_page_uses_abacus_theme_classes", () => {
    render(<AboutRoute ctx={baseCtx()} />);
    const root = document.querySelector(".about-us--page");
    expect(root?.classList.contains("about-us--abacus-classic")).toBe(true);
  });
});
