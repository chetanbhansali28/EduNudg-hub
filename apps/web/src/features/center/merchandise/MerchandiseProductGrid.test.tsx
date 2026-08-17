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
    courseNames: ["Abacus Core"],
    levelNames: ["Level 1"],
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
    expect(screen.getByText("SKU KIT001")).toBeDefined();

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

  it("regression_center_merchandise_shop_cards_are_horizontal_one_per_row", () => {
    const { container } = render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={vi.fn()} />
    );
    const catalogList = container.querySelector(".ed-merch-catalog");
    expect(catalogList).toBeTruthy();
    const cards = container.querySelectorAll(".ed-product-card--row");
    expect(cards).toHaveLength(2);
    expect(catalogList?.querySelectorAll(":scope > .ed-product-card--row")).toHaveLength(2);
  });

  it("regression_center_merchandise_shop_omits_placeholder_description", () => {
    render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={vi.fn()} />
    );
    expect(screen.queryByText("Training kits and supplies for your center.")).toBeNull();
  });

  it("regression_center_merchandise_shop_add_label_is_not_truncated", () => {
    const { container } = render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={vi.fn()} />,
    );
    const addButtons = screen.getAllByRole("button", { name: "Add to Order" });
    expect(addButtons).toHaveLength(2);
    expect(addButtons[0]?.textContent).toBe("Add to Order");
    expect(container.querySelector(".ed-product-card__main")).toBeTruthy();
    expect(container.querySelector(".ed-product-card__body")).toBeNull();
    const card = container.querySelector(".ed-product-card--row");
    const actions = card?.querySelector(".ed-product-card__actions");
    expect(card?.contains(actions ?? null)).toBe(true);
    expect(actions?.parentElement).toBe(card);
  });

  it("regression_center_merchandise_shop_places_price_beside_title", () => {
    const { container } = render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={vi.fn()} />,
    );
    const heading = container.querySelector(".ed-product-card__heading");
    expect(heading?.querySelector(".ed-product-card__name")).toBeTruthy();
    expect(heading?.querySelector(".ed-product-card__price")).toBeTruthy();
    expect(container.querySelector(".ed-product-card__copy")).toBeTruthy();
  });

  it("regression_center_merchandise_shop_shows_catalog_curriculum", () => {
    render(
      <MerchandiseProductGrid catalog={catalog} cart={{}} students={students} onUpdateLine={vi.fn()} />,
    );
    expect(screen.getByText("Curriculum: Abacus Core")).toBeDefined();
    expect(screen.getByText("Program: Level 1")).toBeDefined();
  });
});
