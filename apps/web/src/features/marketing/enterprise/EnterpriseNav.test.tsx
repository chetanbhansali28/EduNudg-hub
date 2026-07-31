import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepageDefaults";
import { EnterpriseNav } from "./EnterpriseNav";

describe("EnterpriseNav", () => {
  it("regression_hash_nav_links_stay_on_homepage", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <EnterpriseNav config={DEFAULT_HOMEPAGE_CONFIG} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Features" }).getAttribute("href")).toBe("#features");
    expect(screen.getByRole("link", { name: "FAQ" }).getAttribute("href")).toBe("#faq");
  });

  it("regression_hash_nav_links_from_login_go_home", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <EnterpriseNav config={DEFAULT_HOMEPAGE_CONFIG} />
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Features" }).getAttribute("href")).toBe("/#features");
    expect(screen.getByRole("link", { name: "FAQ" }).getAttribute("href")).toBe("/#faq");
  });
});
