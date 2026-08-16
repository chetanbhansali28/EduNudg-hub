# Merchandise ordering

Brand-managed catalog; franchise centers place orders from an ecommerce-style shop. Gated by the `merchandise` feature flag. Competitions are a separate module (`/app/competitions`, flag `competitions`).

## Portals & routes

| Portal | Route | Purpose |
|--------|-------|---------|
| Brand | `/app/merchandise` | Catalog CRUD, promos, payment settings, order fulfillment — pipeline chrome like Franchise Applications (`PipelinePageHeader` + Active/Draft/Orders/Total KPIs); Catalog / Promo Codes / Orders / Payment settings each use desktop list + detail |
| Center | `/app/merchandise` | Shop + checkout and order history — pipeline chrome like Curriculum (`PipelinePageHeader` + Catalog/Unpaid/Orders/Total KPIs); Shop / My Orders tabs; Shop list is one horizontal product card per row (same list density as Inventory) |
| Platform | `/admin/brands/:slug` | Enable `merchandise` feature toggle |

Legacy `/app/kits` redirects to `/app/merchandise`.

## Product photos

- **Max 5 photos** per catalog SKU, stored in the public **`brand-assets`** Supabase bucket (same bucket as brand logos).
- **Object path:** `{brand_id}/merchandise/{catalog_item_id}/photo-{slot}.{ext}` where `slot` is `1`–`5`.
- **Replacement:** uploading to a slot deletes any existing `photo-{slot}.*` files in that folder before upload (consistent naming enables upsert).
- **Database:** `merchandise_catalog.photo_urls` — `text[]`, max length 5; index `0` = slot 1, etc. Empty strings mean no photo in that slot.
- **Client:** `apps/web/src/lib/merchandiseProductPhotoStorage.ts`
- **Brand UI:** five upload slots per catalog row on brand `/app/merchandise` → Catalog.
- **Center UI:** Shop catalog uses horizontal product cards (`ed-product-card--row`), one SKU per row in the pipeline list column. Compact header (thumbnail, name/SKU/badge, price) plus a stacked qty / full-width **Add to Order** footer. Cards show a thumbnail plus a thumb strip when multiple photos exist.

Allowed MIME types match the `brand-assets` bucket: PNG, JPEG, WebP, GIF (5 MB per file).

## Center shop UX

1. **Shop** tab — one horizontal catalog card per SKU. Title and SKU sit with price on the right; quantity and **Add to Order** stack in a full-width footer so the add label is never truncated at Curriculum list width (`regression_center_merchandise_shop_add_label_is_not_truncated`). Desktop `PipelineWorkspace` list column uses the same width as Curriculum (`minmax(16rem, 0.95fr)` / `minmax(0, 2.05fr)`). Do not fill empty descriptions with boilerplate copy (`regression_center_merchandise_shop_omits_placeholder_description`). Checkout in the detail column on desktop (shipping, promo, payment). Page chrome matches Curriculum (`PipelinePageHeader`, `LeadKpiGrid`, search, `FilterTabs`, `PipelineWorkspace`). Do not use a two-up product grid in column 1 (`regression_center_merchandise_shop_cards_are_horizontal_one_per_row`, `regression_center_merchandise_list_column_matches_curriculum_width`).
2. **My orders** tab — order history in the list column; allocations and student shipping addresses in detail.

## Payments

Brand-configurable: Razorpay checkout, invoice/bank transfer, or both (`brand_settings.settings.merchandise`).

## Related

- Canonical behavior: [`openspec/specs/brand-merchandise/spec.md`](../../openspec/specs/brand-merchandise/spec.md)
- [feature-flags.md](./feature-flags.md) — `merchandise` key
- [navigation-spec.md](./navigation-spec.md) — sidebar entries
- [table-dictionary.md](../database/table-dictionary.md) — schema
- Migration `045_merchandise_catalog_photos.sql` — `photo_urls` + center catalog read policy
