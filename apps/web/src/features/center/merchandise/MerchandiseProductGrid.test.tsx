import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MerchandiseProductGrid } from "./MerchandiseProductGrid";

const catalog = [
  {
    id: "item-1",
    sku: "KIT001",
    name: "Abacus kit",
    price_cents: 150000,
    currency: "INR",
    photo_urls: ["https://cdn/kit.jpg", "https://cdn/kit-2.jpg"],
  },
  { id: "item-2", sku: "KIT002", name: "Workbook", price_cents: 50000, currency: "INR", photo_urls: [] },
];

const students = [{ id: "stu-1", full_name: "Asha Kumar" }];

describe("MerchandiseProductGrid", () => {
  it("regression_merchandise_grid_shows_products_and_quantity_controls", () => {
    const onUpdateLine = vi.fn();
    render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={onUpdateLine} />
    );

    expect(screen.getByText("Abacus kit")).toBeDefined();
    expect(screen.getByText("Workbook")).toBeDefined();
    expect(screen.getByText("Best Seller")).toBeDefined();
    expect(screen.getByText("KIT001")).toBeDefined();

    fireEvent.click(screen.getAllByRole("button", { name: "Increase quantity" })[0]!);

    expect(onUpdateLine).toHaveBeenCalledWith("item-1", {
      catalogItemId: "item-1",
      quantity: 1,
      studentId: "",
    });
  });

  it("regression_merchandise_grid_shows_product_photos", () => {
    render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={vi.fn()} />
    );
    expect(screen.getByRole("img", { name: "Abacus kit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Show photo 1" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Show photo 2" })).toBeDefined();
  });

  it("regression_merchandise_add_to_order_sets_quantity_when_zero", () => {
    const onUpdateLine = vi.fn();
    render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={onUpdateLine} />
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Add to Order" })[0]!);
    expect(onUpdateLine).toHaveBeenCalledWith("item-1", {
      catalogItemId: "item-1",
      quantity: 1,
      studentId: "",
    });
  });
});
