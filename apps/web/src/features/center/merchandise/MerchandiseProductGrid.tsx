import { useState } from "react";
import { Button, QuantityStepper } from "@edunudg/ui";
import { formatInrFromPaise } from "@/lib/inrCurrency";
import { activeMerchandisePhotoUrls } from "@/lib/merchandiseProductPhotoStorage";
import type { MerchandiseCatalogItem, MerchandiseShopLine, MerchandiseStudentOption } from "./merchandiseShopTypes";

type Props = {
  catalog: MerchandiseCatalogItem[];
  cart: Record<string, MerchandiseShopLine>;
  students: MerchandiseStudentOption[];
  onUpdateLine: (catalogItemId: string, patch: Partial<MerchandiseShopLine>) => void;
};

const STOCK_VALUE = "";

function productDescription(item: MerchandiseCatalogItem): string {
  return item.description?.trim() || "Training kits and supplies for your center.";
}

function MerchandiseProductGallery({ photos, name }: { photos: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (photos.length === 0) {
    return <div className="ed-product-card__image ed-product-card__image--empty" aria-hidden />;
  }

  const active = photos[activeIndex] ?? photos[0]!;

  return (
    <>
      <img src={active} alt={name} className="ed-product-card__image" />
      {photos.length > 1 ? (
        <div className="ed-merch-product__thumbs" role="list" aria-label={`${name} photos`}>
          {photos.map((url, index) => (
            <button
              key={url}
              type="button"
              className={`ed-merch-product__thumb${index === activeIndex ? " ed-merch-product__thumb--active" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}

export function MerchandiseProductGrid({ catalog, cart, onUpdateLine }: Props) {
  if (catalog.length === 0) {
    return <p className="ed-empty">No merchandise available from your brand yet.</p>;
  }

  return (
    <div className="ed-merch-catalog" role="list">
      {catalog.map((item, index) => {
        const line = cart[item.id] ?? { catalogItemId: item.id, quantity: 0, studentId: STOCK_VALUE };

        const setQty = (next: number) => {
          const quantity = Math.max(0, next);
          onUpdateLine(item.id, {
            catalogItemId: item.id,
            quantity,
            studentId: quantity === 0 ? STOCK_VALUE : line.studentId,
          });
        };

        const photos = activeMerchandisePhotoUrls(item.photo_urls);

        return (
          <article key={item.id} role="listitem" className="ed-product-card">
            <div className="ed-product-card__media">
              <MerchandiseProductGallery photos={photos} name={item.name} />
              <span className="ed-product-card__sku">{item.sku}</span>
              {index === 0 ? <span className="ed-product-card__badge">Best Seller</span> : null}
            </div>
            <div className="ed-product-card__body">
              <div className="ed-product-card__head">
                <h3 className="ed-product-card__name">{item.name}</h3>
                <span className="ed-product-card__price">
                  {formatInrFromPaise(item.price_cents, item.currency)}
                </span>
              </div>
              <p className="ed-product-card__desc">{productDescription(item)}</p>
              <div className="ed-product-card__actions">
                <QuantityStepper
                  value={line.quantity}
                  onChange={setQty}
                  aria-label={`Quantity for ${item.name}`}
                />
                <Button
                  onClick={() => {
                    if (line.quantity === 0) setQty(1);
                  }}
                  disabled={line.quantity > 0}
                >
                  Add to Order
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
