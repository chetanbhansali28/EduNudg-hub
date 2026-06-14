import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CenterOpsMobileChrome } from "./CenterOpsMobileChrome";

describe("CenterOpsMobileChrome", () => {
  it("regression_renders_bottom_nav_on_students_route", () => {
    render(
      <MemoryRouter initialEntries={["/app/students"]}>
        <CenterOpsMobileChrome />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation", { name: "Center navigation" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Students" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Leads" })).toBeDefined();
  });
});
