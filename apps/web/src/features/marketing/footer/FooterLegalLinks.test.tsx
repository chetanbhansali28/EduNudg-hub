import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { FooterLegalLinks } from "@/features/marketing/footer/FooterLegalLinks";

describe("FooterLegalLinks", () => {
  it("regression_footer_legal_links_use_shared_labels", () => {
    render(
      <MemoryRouter>
        <FooterLegalLinks config={DEFAULT_HOMEPAGE_CONFIG} legalPages={{}} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Terms & Conditions" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Refund Policy" })).toBeDefined();
  });
});
