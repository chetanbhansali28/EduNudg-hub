-- Ensure every brand has learn + parents localhost domain mappings (synthetic hosts for
-- local multi-host and Vercel same-origin portal override lookups).

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
SELECT 'learn.' || b.slug || '.localhost', b.id, NULL, 'learn', false
FROM public.brands b
WHERE b.deleted_at IS NULL
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  portal_type = EXCLUDED.portal_type,
  updated_at = now();

INSERT INTO public.domain_mappings (hostname, brand_id, center_id, portal_type, is_primary)
SELECT 'parents.' || b.slug || '.localhost', b.id, NULL, 'parents', false
FROM public.brands b
WHERE b.deleted_at IS NULL
ON CONFLICT (hostname) DO UPDATE SET
  brand_id = EXCLUDED.brand_id,
  portal_type = EXCLUDED.portal_type,
  updated_at = now();
