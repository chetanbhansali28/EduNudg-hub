import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CenterBlurbSection } from "./CenterBlurbSection";

describe("CenterBlurbSection", () => {
  it("regression_renders_center_blurb_from_profile", () => {
    render(
      <CenterBlurbSection
        profile={{
          centerId: "c1",
          centerSlug: "koramangala",
          centerName: "Koramangala",
          displayName: "Abacus Koramangala",
          city: "Bengaluru",
          region: "KA",
          pincode: "560034",
          addressLine1: "12 Main Road",
          contactPhone: "+919876543210",
          photoUrl: "https://cdn/center.jpg",
          shortDescription: "Flagship center in South Bengaluru.",
          socialLinks: [{ platform: "Instagram", url: "https://instagram.com/center" }],
          brandName: "Abacus World",
          brandSlug: "abacusworld",
        }}
      />
    );
    expect(screen.getByText("Abacus Koramangala")).toBeDefined();
    expect(screen.getByText("Flagship center in South Bengaluru.")).toBeDefined();
    expect(screen.getByText(/12 Main Road/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Instagram" })).toBeDefined();
  });
});
