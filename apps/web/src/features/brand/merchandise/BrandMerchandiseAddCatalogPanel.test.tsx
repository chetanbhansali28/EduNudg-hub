import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrandMerchandiseAddCatalogPanel } from "./BrandMerchandiseAddCatalogPanel";

vi.mock("./MerchandiseProductPhotos", () => ({
  MerchandiseProductPhotos: () => <div data-testid="add-form-photos">Photos</div>,
}));

describe("BrandMerchandiseAddCatalogPanel", () => {
  const baseProps = {
    open: true,
    form: { sku: "", name: "", priceRupees: "", currency: "INR", isActive: true },
    onFormChange: vi.fn(),
    onSubmit: vi.fn(),
    onClose: vi.fn(),
    submitDisabled: true,
    submitPending: false,
    brandId: "brand-1",
    savedItemId: null as string | null,
    photoUrls: [] as string[],
    onPhotosChange: vi.fn(),
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
});
