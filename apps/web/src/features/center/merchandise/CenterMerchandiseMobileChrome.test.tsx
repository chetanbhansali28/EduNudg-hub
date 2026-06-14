import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CenterMerchandiseMobileChrome } from "./CenterMerchandiseMobileChrome";

describe("CenterMerchandiseMobileChrome", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", undefined);
  });

  it("regression_renders_store_bottom_nav_on_merchandise_route", () => {
    render(
      <MemoryRouter initialEntries={["/app/merchandise"]}>
        <CenterMerchandiseMobileChrome />
      </MemoryRouter>
    );

    expect(screen.getByRole("navigation", { name: "Store navigation" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Store" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Orders" })).toBeDefined();
  });
});
