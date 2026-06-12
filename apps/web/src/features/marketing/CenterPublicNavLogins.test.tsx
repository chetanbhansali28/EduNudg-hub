import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CenterPublicNavLogins } from "./CenterPublicNavLogins";

describe("CenterPublicNavLogins", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: { protocol: "http:", hostname: "koramangala.abacusworld.localhost", port: "9000" },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows only Student Login linking to learn portal", () => {
    render(
      <MemoryRouter>
        <CenterPublicNavLogins brandSlug="abacusworld" />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: "Student Login" });
    expect(link.getAttribute("href")).toBe("http://learn.abacusworld.localhost:9000/login");
    expect(screen.queryByRole("link", { name: /staff login/i })).toBeNull();
  });
});
