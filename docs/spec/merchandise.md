# Merchandise ordering

Brand-managed catalog; franchise centers place orders from an ecommerce-style shop. Gated by the `merchandise` feature flag.

## Portals & routes

| Portal | Route | Purpose |
|--------|-------|---------|
| Brand | `/app/merchandise` | Catalog CRUD, promos, payment settings, order fulfillment |
| Center | `/app/merchandise` | Shop (product grid + checkout), order history |
| Platform | `/admin/brands/:slug` | Enable `merchandise` feature toggle |

Legacy `/app/kits` redirects to `/app/merchandise`.

## Product photos

- **Max 5 photos** per catalog SKU, stored in the public **`brand-assets`** Supabase bucket (same bucket as brand logos).
- **Object path:** `{brand_id}/merchandise/{catalog_item_id}/photo-{slot}.{ext}` where `slot` is `1`–`5`.
- **Replacement:** uploading to a slot deletes any existing `photo-{slot}.*` files in that folder before upload (consistent naming enables upsert).
- **Database:** `merchandise_catalog.photo_urls` — `text[]`, max length 5; index `0` = slot 1, etc. Empty strings mean no photo in that slot.
- **Client:** `apps/web/src/lib/merchandiseProductPhotoStorage.ts`
- **Brand UI:** five upload slots per catalog row on brand `/app/merchandise` → Catalog.
- **Center UI:** product cards show a main image + thumbnail strip when multiple photos exist.

Allowed MIME types match the `brand-assets` bucket: PNG, JPEG, WebP, GIF (5 MB per file).

## Center shop UX

1. **Shop** tab — product grid with +/- quantity, optional per-line student assignment, sticky checkout (shipping, promo, payment).
2. **My orders** tab — order history, allocations, student shipping addresses.

## Payments

Brand-configurable: Razorpay checkout, invoice/bank transfer, or both (`brand_settings.settings.merchandise`).

## Related

- [feature-flags.md](./feature-flags.md) — `merchandise` key
- [navigation-spec.md](./navigation-spec.md) — sidebar entries
- [table-dictionary.md](../database/table-dictionary.md) — schema
- Migration `045_merchandise_catalog_photos.sql` — `photo_urls` + center catalog read policy
