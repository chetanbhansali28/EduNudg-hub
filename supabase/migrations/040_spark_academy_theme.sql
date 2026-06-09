-- Spark Academy marketing theme + center landing theme/stats passthrough.

ALTER TABLE public.brands
  DROP CONSTRAINT IF EXISTS brands_marketing_theme_check;

ALTER TABLE public.brands
  ADD CONSTRAINT brands_marketing_theme_check
  CHECK (marketing_theme IN ('novu', 'abacus-classic', 'spark-academy'));

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
      'marketing_theme', b.marketing_theme,
      'public_stats', public.brand_public_stats_json(b.id),
      'center_id', c.id,
      'center_slug', c.slug,
      'center_name', c.name,
      'center_display_name', c.display_name,
      'center_city', c.city,
      'center_pincode', c.pincode,
      'center_address_line1', c.address_line1,
      'center_contact_phone', c.contact_phone,
      'center_short_description', c.short_description,
      'landing', COALESCE(bs.settings -> 'center_landing', bs.settings -> 'landing', '{}'::jsonb),
      'success_stories', COALESCE(
        (
          SELECT jsonb_agg(
            jsonb_build_object(
              'quote', s.quote,
              'author', trim(
                s.author_name || coalesce(' · ' || nullif(trim(s.author_role), ''), '')
              ),
              'rating', s.rating,
              'title', s.title
            )
            ORDER BY s.sort_order ASC, s.created_at DESC
          )
          FROM public.brand_success_stories s
          WHERE s.brand_id = b.id
            AND s.is_published = true
        ),
        '[]'::jsonb
      ),
      'curriculum', public.brand_public_curriculum_json(b.id)
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
