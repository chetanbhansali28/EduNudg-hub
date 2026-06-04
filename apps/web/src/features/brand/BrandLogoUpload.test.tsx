import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandLogoUpload } from "./BrandLogoUpload";

vi.mock("@/lib/brandLogoStorage", () => ({
  uploadBrandLogo: vi.fn(),
}));

describe("BrandLogoUpload", () => {
  it("prompts to create brand when brandId is null", () => {
    render(<BrandLogoUpload brandId={null} />);
    expect(screen.getByText(/create the brand first/i)).toBeDefined();
  });

  it("renders file input when brandId is set", () => {
    render(<BrandLogoUpload brandId="b1" currentLogoUrl={null} />);
    expect(screen.getByLabelText("Brand logo")).toBeDefined();
  });
});
