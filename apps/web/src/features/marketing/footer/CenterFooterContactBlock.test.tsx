import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CenterFooterContactBlock } from "./CenterFooterContactBlock";

describe("CenterFooterContactBlock", () => {
  it("regression_center_footer_renders_franchise_address_and_phone", () => {
    render(
      <CenterFooterContactBlock
        contact={{
          addressLines: ["12 Main Road", "Bengaluru · KA · 560034"],
          phone: "+919876543210",
        }}
      />
    );
    expect(screen.getByRole("heading", { name: "This center" })).toBeDefined();
    expect(screen.getByText("12 Main Road")).toBeDefined();
    expect(screen.getByText("Bengaluru · KA · 560034")).toBeDefined();
    expect(screen.getByRole("link", { name: "+919876543210" }).getAttribute("href")).toBe(
      "tel:+919876543210"
    );
  });
});
