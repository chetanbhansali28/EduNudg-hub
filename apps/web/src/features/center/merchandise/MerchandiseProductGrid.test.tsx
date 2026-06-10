import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MerchandiseProductGrid } from "./MerchandiseProductGrid";

const catalog = [
  {
    id: "item-1",
    sku: "AB-01",
    name: "Abacus kit",
    price_cents: 150000,
    currency: "INR",
    photo_urls: ["https://cdn/kit.jpg", "https://cdn/kit-2.jpg"],
  },
  { id: "item-2", sku: "BK-02", name: "Workbook", price_cents: 50000, currency: "INR", photo_urls: [] },
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

    const increaseButtons = screen.getAllByRole("button", { name: "Increase quantity" });
    fireEvent.click(increaseButtons[0]!);

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

  it("shows student assign dropdown when quantity is active", () => {
    render(
      <MerchandiseProductGrid
        catalog={catalog}
        cart={{ "item-1": { catalogItemId: "item-1", quantity: 2, studentId: "" } }}
        students={students}
        onUpdateLine={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Assign to student (optional)")).toBeDefined();
    expect(screen.getByRole("option", { name: "Asha Kumar" })).toBeDefined();
  });
});
