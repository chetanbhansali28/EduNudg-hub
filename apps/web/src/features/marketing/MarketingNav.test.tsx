import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
import { sanitizeCenterPublicNavConfig } from "@/lib/centerPublicNav";
import { MarketingNav } from "./MarketingNav";

vi.mock("./useNavTheme", () => ({
  useNavTheme: () => "light",
}));

vi.mock("./useHeroIntroComplete", () => ({
  useHeroIntroComplete: () => true,
}));

describe("MarketingNav", () => {
  it("regression_wordmark_preserves_brand_name_casing", () => {
    const config = buildBrandLandingConfig("Abacus World");
    config.meta.siteName = "KORAMANGALA Abacus Center";

    render(
      <MemoryRouter>
        <MarketingNav config={config} />
      </MemoryRouter>
    );

    expect(screen.getByText("KORAMANGALA Abacus Center")).toBeDefined();
    expect(screen.queryByText("koramangala abacus center")).toBeNull();
  });

  it("shows Student Login only when brandSlug is set for center sites", () => {
    vi.stubGlobal("window", {
      location: { protocol: "http:", hostname: "koramangala.abacusworld.localhost", port: "9000" },
    });

    const config = buildBrandLandingConfig("Abacus World");
    render(
      <MemoryRouter>
        <MarketingNav config={config} brandSlug="abacusworld" />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: "Student Login" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /staff login/i })).toBeNull();

    vi.unstubAllGlobals();
  });

  it("regression_center_nav_has_book_free_trial_not_enroll_link", () => {
    vi.stubGlobal("window", {
      location: { protocol: "http:", hostname: "koramangala.abacusworld.localhost", port: "9000" },
    });

    const config = sanitizeCenterPublicNavConfig(
      buildCenterLandingConfig("Koramangala Center", "Abacus World", "Bengaluru")
    );
    render(
      <MemoryRouter>
        <MarketingNav config={config} brandSlug="abacusworld" />
      </MemoryRouter>
    );

    expect(screen.getAllByRole("link", { name: "Book a free trial" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: /^enroll$/i })).toBeNull();

    vi.unstubAllGlobals();
  });
});
