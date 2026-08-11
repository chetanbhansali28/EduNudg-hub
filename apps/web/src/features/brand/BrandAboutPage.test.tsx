import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { BrandAboutPage } from "./BrandAboutPage";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import type { BrandLandingOutletContext } from "./BrandPublicLayout";

function AboutRoute({ ctx }: { ctx: BrandLandingOutletContext }) {
  return (
    <MemoryRouter initialEntries={["/about"]}>
      <Routes>
        <Route path="/" element={<div>Home page</div>} />
        <Route element={<Outlet context={ctx} />}>
          <Route path="/about" element={<BrandAboutPage />} />
        </Route>
      </Routes>
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
});
