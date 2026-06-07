import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { buildBrandLandingConfig, mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";
import { LeadModalProvider } from "@/features/marketing/abacus-classic/LeadModalContext";
import type { BrandLandingOutletContext } from "./BrandPublicLayout";
import { BrandLandingPage } from "./BrandLandingPage";

vi.mock("@/features/marketing/MarketingContent", () => ({
  MarketingContent: ({ config, brandSlug }: { config?: { hero?: { line1: string } }; brandSlug?: string }) => {
    if (!config?.hero) {
      throw new Error("config.hero is undefined");
    }
    return (
      <div>
        Novu landing
        <span>{config.hero.line1}</span>
        {brandSlug && <span>{brandSlug}</span>}
      </div>
    );
  },
}));

function renderWithOutlet(context: BrandLandingOutletContext) {
  const page = (
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route index element={<BrandLandingPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

  if (context.marketingTheme === "abacus-classic") {
    return render(<LeadModalProvider>{page}</LeadModalProvider>);
  }

  return render(page);
}

describe("BrandLandingPage", () => {
  it("renders Novu MarketingContent when marketingTheme is novu", () => {
    const config = buildBrandLandingConfig("Abacus World");
    renderWithOutlet({
      config,
      brandSlug: "abacusworld",
      marketingTheme: "novu",
      publicCurriculum: [],
      publicStats: { centersCount: 0, studentsCount: 0 },
    });

    expect(screen.getByText("Novu landing")).toBeDefined();
    expect(screen.getByText("Own an")).toBeDefined();
    expect(screen.getByText("abacusworld")).toBeDefined();
  });

  it("renders AbacusClassicContent when marketingTheme is abacus-classic", () => {
    const config = mergeAbacusClassicLandingConfig("Smart Brain Abacus");
    renderWithOutlet({
      config,
      brandSlug: "smart-brain-abacus",
      marketingTheme: "abacus-classic",
      publicCurriculum: [
        {
          name: "Abacus Junior",
          description: "Foundations",
          whyTake: null,
          whatYouLearn: null,
          marketingVideoUrl: null,
          versionNumber: 1,
          levels: [],
        },
      ],
      publicStats: { centersCount: 12, studentsCount: 5000 },
    });

    expect(screen.getByRole("main")).toBeDefined();
    expect(screen.getByText(/Make children super fast in/)).toBeDefined();
    expect(screen.getAllByRole("heading", { level: 3, name: "Abacus Junior" })).toHaveLength(2);
  });
});
