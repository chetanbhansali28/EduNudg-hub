import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { StaffMobileChrome } from "./StaffMobileChrome";
import { centerNavSections } from "@/lib/portalNav";

describe("StaffMobileChrome", () => {
  it("regression_renders_all_center_sidebar_links_on_fees_route", () => {
    const sections = centerNavSections("/app/fees");
    render(
      <MemoryRouter initialEntries={["/app/fees"]}>
        <StaffMobileChrome sections={sections} ariaLabel="Center navigation" />
      </MemoryRouter>
    );

    const sidebarLinks = sections.flatMap((section) => section.items.map((item) => item.label));
    for (const label of sidebarLinks) {
      expect(screen.getByRole("link", { name: label })).toBeDefined();
    }
    expect(screen.getByRole("link", { name: "Fees & Payments" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });
});
