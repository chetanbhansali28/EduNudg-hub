import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MarketingSectionNavLink } from "./MarketingSectionNavLink";

describe("MarketingSectionNavLink", () => {
  it("regression_hash_from_about_page_points_at_homepage_section", () => {
    render(
      <MemoryRouter initialEntries={["/about"]}>
        <MarketingSectionNavLink href="#gallery" label="Gallery" className="nav-link" />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "Gallery" });
    expect(link.getAttribute("href")).toBe("/#gallery");
  });

  it("regression_hash_on_homepage_stays_hash_only", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <MarketingSectionNavLink href="#gallery" label="Gallery" />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Gallery" }).getAttribute("href")).toBe("#gallery");
  });
});
