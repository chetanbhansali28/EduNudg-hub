export type MerchandiseShopLine = {
  catalogItemId: string;
  quantity: number;
  /** Empty string = center stock / bulk */
  studentId: string;
};

export type MerchandiseCatalogItem = {
  id: string;
  sku: string;
  name: string;
  price_cents: number;
  currency: string;
  photo_urls?: string[] | null;
  description?: string | null;
};

export type MerchandiseStudentOption = {
  id: string;
  full_name: string;
};

export function shopLinesFromCart(cart: Record<string, MerchandiseShopLine>): MerchandiseShopLine[] {
  return Object.values(cart).filter((line) => line.quantity > 0);
}

export function cartTotalQuantity(cart: Record<string, MerchandiseShopLine>): number {
  return shopLinesFromCart(cart).reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotalCents(
  cart: Record<string, MerchandiseShopLine>,
  catalog: MerchandiseCatalogItem[]
): number {
  return shopLinesFromCart(cart).reduce((sum, line) => {
    const item = catalog.find((c) => c.id === line.catalogItemId);
    return sum + (item ? item.price_cents * line.quantity : 0);
  }, 0);
}
