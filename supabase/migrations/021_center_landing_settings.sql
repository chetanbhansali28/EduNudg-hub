-- Center public sites read center_landing overrides; fall back to brand landing.

CREATE OR REPLACE FUNCTION public.get_center_landing_public(
  p_brand_slug text,
  p_center_slug text
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'brand_id', b.id,
      'brand_slug', b.slug,
      'brand_name', b.name,
      'brand_logo_url', b.logo_url,
      'center_id', c.id,
      'center_slug', c.slug,
      'center_name', c.name,
      'center_city', c.city,
      'landing', COALESCE(bs.settings -> 'center_landing', bs.settings -> 'landing', '{}'::jsonb)
    ),
    '{}'::jsonb
  )
  FROM public.franchise_centers c
  JOIN public.brands b ON b.id = c.brand_id
  LEFT JOIN public.brand_settings bs ON bs.brand_id = b.id
  WHERE p_brand_slug IS NOT NULL
    AND p_center_slug IS NOT NULL
    AND b.slug = p_brand_slug
    AND c.slug = p_center_slug
    AND b.deleted_at IS NULL
    AND b.status = 'active'
    AND c.deleted_at IS NULL
    AND c.status = 'active'
  LIMIT 1;
$$;
