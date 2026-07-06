import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandSocialFooterIcons } from "./BrandSocialFooterIcons";

describe("BrandSocialFooterIcons", () => {
  it("renders configured facebook and instagram links only", () => {
    render(
      <BrandSocialFooterIcons
        variant="novu"
        socialConnect={{
          facebookUrl: "https://facebook.com/brand",
          instagramUrl: "https://instagram.com/brand",
        }}
      />
    );

    expect(screen.getByRole("link", { name: "Facebook" }).getAttribute("href")).toBe(
      "https://facebook.com/brand"
    );
    expect(screen.getByRole("link", { name: "Instagram" }).getAttribute("href")).toBe(
      "https://instagram.com/brand"
    );
  });

  it("renders nothing when no urls are configured", () => {
    const { container } = render(<BrandSocialFooterIcons variant="abacus-classic" socialConnect={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
