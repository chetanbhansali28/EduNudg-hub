-- Product photos for merchandise catalog (up to 5 per SKU).
-- Storage path: `{brand_id}/merchandise/{catalog_id}/photo-{slot}.{ext}` in `brand-assets`.

ALTER TABLE public.merchandise_catalog
  ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.merchandise_catalog
  DROP CONSTRAINT IF EXISTS merchandise_catalog_photo_urls_max;

ALTER TABLE public.merchandise_catalog
  ADD CONSTRAINT merchandise_catalog_photo_urls_max
  CHECK (coalesce(array_length(photo_urls, 1), 0) <= 5);

COMMENT ON COLUMN public.merchandise_catalog.photo_urls IS
  'Up to 5 public image URLs; index 0 = photo slot 1, stored in brand-assets bucket.';

-- Remove legacy kit-era select policy (superseded by brand + center policies).
DROP POLICY IF EXISTS kit_catalog_select ON public.merchandise_catalog;

-- Franchise centers can read active catalog for their brand (for /app/merchandise shop).
DROP POLICY IF EXISTS merchandise_catalog_center_read ON public.merchandise_catalog;
CREATE POLICY merchandise_catalog_center_read ON public.merchandise_catalog
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND public.brand_feature_enabled(brand_id, 'merchandise')
    AND EXISTS (
      SELECT 1
      FROM public.franchise_centers fc
      WHERE fc.brand_id = merchandise_catalog.brand_id
        AND public.has_center_access(fc.id)
    )
  );
