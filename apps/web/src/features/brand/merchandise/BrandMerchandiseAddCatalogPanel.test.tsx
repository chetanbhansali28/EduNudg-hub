import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandMerchandiseAddCatalogPanel } from "./BrandMerchandiseAddCatalogPanel";

vi.mock("./MerchandiseProductPhotos", () => ({
  MerchandiseProductPhotos: () => <div data-testid="add-form-photos">Photos</div>,
}));

describe("BrandMerchandiseAddCatalogPanel", () => {
  const baseProps = {
    open: true,
    form: { sku: "", name: "", priceRupees: "", currency: "INR", isActive: true, curriculumLinks: [] },
    onFormChange: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
    submitDisabled: true,
    submitPending: false,
    brandId: "brand-1",
    savedItemId: null as string | null,
    photoUrls: [] as string[],
    onPhotosChange: vi.fn(),
    programs: [{ id: "prog-1", name: "Abacus Core", levels: [] }],
  };

  it("renders nothing when closed", () => {
    const { container } = render(<BrandMerchandiseAddCatalogPanel {...baseProps} open={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows photo uploader after item is saved", () => {
    render(
      <BrandMerchandiseAddCatalogPanel
        {...baseProps}
        savedItemId="item-new"
        photoUrls={["https://cdn.example/photo.jpg"]}
        submitDisabled={false}
      />
    );

    expect(screen.getByRole("button", { name: "Done" })).toBeDefined();
    expect(screen.getByTestId("add-form-photos")).toBeDefined();
    expect(screen.getByText(/Item saved/)).toBeDefined();
  });

  it("regression_add_catalog_panel_shows_curriculum_picker", () => {
    render(<BrandMerchandiseAddCatalogPanel {...baseProps} />);
    expect(screen.getByRole("group", { name: "Curriculum" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Abacus Core" })).toBeDefined();
    expect(screen.getByText(/Tag courses and levels/)).toBeDefined();
  });
});
