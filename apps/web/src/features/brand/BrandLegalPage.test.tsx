import { describe, expect, it } from "vitest";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { BrandLegalPage } from "./BrandLegalPage";
import type { BrandLandingOutletContext } from "./BrandPublicLayout";
import { mergeAbacusClassicLandingConfig } from "@/lib/brandLandingDefaults";

function renderLegalPage(kind: "privacy" | "terms", legalPages: BrandLandingOutletContext["legalPages"]) {
  const context: BrandLandingOutletContext = {
    config: mergeAbacusClassicLandingConfig("Test Brand"),
    brandSlug: "test-brand",
    marketingTheme: "abacus-classic",
    publicCurriculum: [],
    publicStats: { centersCount: 0, studentsCount: 0 },
    legalPages,
  };

  render(
    <MemoryRouter initialEntries={[`/legal/${kind}`]}>
      <Routes>
        <Route path="/" element={<Outlet context={context} />}>
          <Route path="legal/:kind" element={<BrandLegalPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("BrandLegalPage", () => {
  it("renders pdf viewer when privacy document is published", () => {
    renderLegalPage("privacy", {
      privacy: {
        fileName: "privacy.pdf",
        fileUrl: "https://cdn.example/privacy.pdf",
        mimeType: "application/pdf",
        uploadedAt: "2026-01-01T00:00:00.000Z",
      },
    });

    expect(screen.getByRole("heading", { name: "Privacy Policy" })).toBeDefined();
    expect(document.querySelector("iframe")?.getAttribute("src")).toBe("https://cdn.example/privacy.pdf");
  });

  it("shows unpublished message when document is missing", () => {
    renderLegalPage("terms", {});
    expect(screen.getByText(/not been published yet/i)).toBeDefined();
  });
});
