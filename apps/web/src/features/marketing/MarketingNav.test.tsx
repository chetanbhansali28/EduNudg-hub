import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { buildBrandLandingConfig } from "@/lib/brandLandingDefaults";
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
});
