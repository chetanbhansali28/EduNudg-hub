import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MarketingCtaLink } from "./MarketingCtaLink";

describe("MarketingCtaLink", () => {
  it("regression_renders_stagger_label_on_dark_surface", () => {
    render(
      <MemoryRouter>
        <MarketingCtaLink href="#enroll" label="Book trial" variant="on-dark" />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Book trial/i }).className).toContain(
      "novu-marketing-cta--on-dark"
    );
    expect(document.querySelector(".novu-stagger-label")).toBeTruthy();
  });
});
