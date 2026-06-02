-- Public portal branding for login / white-label (anon-safe, limited fields)

CREATE OR REPLACE FUNCTION public.get_portal_branding(
  p_brand_slug text DEFAULT NULL,
  p_center_slug text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH brand_row AS (
    SELECT b.id, b.slug, b.name, b.logo_url
    FROM public.brands b
    WHERE p_brand_slug IS NOT NULL
      AND b.slug = p_brand_slug
      AND b.deleted_at IS NULL
      AND b.status = 'active'
    LIMIT 1
  ),
  center_row AS (
    SELECT c.id, c.slug, c.name, c.brand_id
    FROM public.franchise_centers c
    INNER JOIN brand_row br ON br.id = c.brand_id
    WHERE p_center_slug IS NOT NULL
      AND c.slug = p_center_slug
      AND c.deleted_at IS NULL
      AND c.status = 'active'
    LIMIT 1
  ),
  settings_row AS (
    SELECT bs.settings
    FROM public.brand_settings bs
    INNER JOIN brand_row br ON br.id = bs.brand_id
    LIMIT 1
  )
  SELECT COALESCE(
    jsonb_build_object(
      'brand_id', br.id,
      'brand_slug', br.slug,
      'brand_name', br.name,
      'brand_logo_url', br.logo_url,
      'center_id', cr.id,
      'center_slug', cr.slug,
      'center_name', cr.name,
      'login_headline', NULLIF(trim(s.settings ->> 'login_headline'), ''),
      'login_subtext', NULLIF(trim(s.settings ->> 'login_subtext'), '')
    ),
    '{}'::jsonb
  )
  FROM brand_row br
  LEFT JOIN center_row cr ON true
  LEFT JOIN settings_row s ON true;
$$;

REVOKE ALL ON FUNCTION public.get_portal_branding(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_portal_branding(text, text) TO anon, authenticated;
