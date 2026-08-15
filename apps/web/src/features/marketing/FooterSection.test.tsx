import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { buildCenterLandingConfig } from "@/lib/centerLandingDefaults";
import { FooterSection } from "./FooterSection";

describe("FooterSection", () => {
  it("regression_novu_center_footer_shows_franchise_contact_not_presence", () => {
    const config = buildCenterLandingConfig("Smart Brain Abacus", "Smart Brain", "Chh.Sambhaji nagar", {
      footer: {
        productLinks: [],
        companyLinks: [],
        connectLinks: [],
        copyright: "© 2026",
        privacyHref: "",
        termsHref: "",
        refundHref: "",
        rich: {
          presence: [{ region: "Brand network", cities: ["Pune"] }],
        },
      },
    });

    render(
      <MemoryRouter>
        <FooterSection
          config={config}
          centerContact={{
            addressLines: ["Flat no 1 Shanti pushp app"],
            phone: "+918806232153",
          }}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "This center" })).toBeDefined();
    expect(screen.getByText("Flat no 1 Shanti pushp app")).toBeDefined();
    expect(screen.queryByText("Our presence")).toBeNull();
    expect(screen.queryByText("Pune")).toBeNull();
  });
});
