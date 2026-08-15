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

  it("regression_center_footer_renders_youtube_and_whatsapp_links", () => {
    render(
      <BrandSocialFooterIcons
        variant="abacus-classic"
        socialConnect={{
          youtubeUrl: "https://youtube.com/@smart_brain_abacus2019",
          whatsappUrl: "https://wa.me/919876543210",
        }}
      />
    );
    expect(screen.getByRole("link", { name: "YouTube" }).getAttribute("href")).toBe(
      "https://youtube.com/@smart_brain_abacus2019"
    );
    expect(screen.getByRole("link", { name: "WhatsApp" }).getAttribute("href")).toBe(
      "https://wa.me/919876543210"
    );
  });

  it("renders nothing when no urls are configured", () => {
    const { container } = render(<BrandSocialFooterIcons variant="abacus-classic" socialConnect={{}} />);
    expect(container.firstChild).toBeNull();
  });
});
