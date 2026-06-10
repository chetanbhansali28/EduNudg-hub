import { useState } from "react";
import { Select } from "@edunudg/ui";
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

function MerchandiseProductGallery({ photos, name }: { photos: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  if (photos.length === 0) {
    return <div className="ed-merch-product__image ed-merch-product__image--empty" aria-hidden />;
  }

  const active = photos[activeIndex] ?? photos[0]!;

  return (
    <div className="ed-merch-product__gallery">
      <img src={active} alt={name} className="ed-merch-product__image" />
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
    </div>
  );
}

export function MerchandiseProductGrid({ catalog, cart, students, onUpdateLine }: Props) {
  if (catalog.length === 0) {
    return <p className="ed-empty">No merchandise available from your brand yet.</p>;
  }

  return (
    <div className="ed-merch-catalog" role="list">
      {catalog.map((item) => {
        const line = cart[item.id] ?? { catalogItemId: item.id, quantity: 0, studentId: STOCK_VALUE };
        const active = line.quantity > 0;

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
          <article
            key={item.id}
            role="listitem"
            className={`ed-merch-product${active ? " ed-merch-product--active" : ""}`}
          >
            <MerchandiseProductGallery photos={photos} name={item.name} />
            <span className="ed-merch-product__sku">{item.sku}</span>
            <h3 className="ed-merch-product__name">{item.name}</h3>
            <span className="ed-merch-product__price">{formatInrFromPaise(item.price_cents, item.currency)}</span>

            <div className="ed-merch-qty" aria-label={`Quantity for ${item.name}`}>
              <button type="button" onClick={() => setQty(line.quantity - 1)} disabled={line.quantity <= 0} aria-label="Decrease quantity">
                −
              </button>
              <span aria-live="polite">{line.quantity}</span>
              <button type="button" onClick={() => setQty(line.quantity + 1)} aria-label="Increase quantity">
                +
              </button>
            </div>

            {active ? (
              <Select
                label="Assign to student (optional)"
                value={line.studentId}
                onChange={(studentId) => onUpdateLine(item.id, { studentId })}
                options={[
                  { value: STOCK_VALUE, label: "Center stock — no student" },
                  ...students.map((s) => ({ value: s.id, label: s.full_name })),
                ]}
              />
            ) : (
              <p className="ed-text-sm ed-muted">Use + to add to your order.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
