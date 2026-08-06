import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("navigation", { name: "Site" }).querySelector(".ent-nav__links a")?.getAttribute("href")).toBe(
      "#features"
    );
    const desktopLinks = screen
      .getByRole("navigation", { name: "Site" })
      .querySelectorAll(".ent-nav__links a");
    expect([...desktopLinks].map((el) => el.textContent)).toContain("Features");
    expect([...desktopLinks].map((el) => el.textContent)).toContain("FAQ");
  });

  it("regression_hash_nav_links_from_login_go_home", () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <EnterpriseNav config={DEFAULT_HOMEPAGE_CONFIG} />
      </MemoryRouter>
    );

    const desktopLinks = screen
      .getByRole("navigation", { name: "Site" })
      .querySelectorAll(".ent-nav__links a");
    expect(desktopLinks[0]?.getAttribute("href")).toBe("/#features");
    expect([...desktopLinks].some((el) => el.getAttribute("href") === "/#faq")).toBe(true);
  });

  it("regression_mobile_menu_toggle_is_present", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <EnterpriseNav config={DEFAULT_HOMEPAGE_CONFIG} />
      </MemoryRouter>
    );

    expect(screen.getByRole("button", { name: "Open menu" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Launch for FREE" })).toBeDefined();
  });

  it("regression_hamburger_opens_left_drawer_with_launch_cta", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <EnterpriseNav config={DEFAULT_HOMEPAGE_CONFIG} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Site menu" });
    expect(drawer.className).toContain("ent-nav__drawer");
    expect(drawer.querySelector(".ent-nav__drawer-cta")?.textContent).toBe("Launch Franchise for FREE");
  });
});
