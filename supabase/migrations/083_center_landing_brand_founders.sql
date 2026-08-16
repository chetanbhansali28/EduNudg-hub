-- Center public landing includes brand homepage founders so franchise sites
-- can show the franchiser first, then always keep the brand owner.

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
      'center_region', c.region,
      'center_pincode', c.pincode,
      'center_address_line1', c.address_line1,
      'center_contact_phone', c.contact_phone,
      'center_photo_url', c.photo_url,
      'center_short_description', c.short_description,
      'center_social_links', COALESCE(c.social_links, '[]'::jsonb),
      'legal_pages', COALESCE(bs.settings -> 'legal_pages', '{}'::jsonb),
      'social_connect', COALESCE(bs.settings -> 'social_connect', '{}'::jsonb),
      'landing', COALESCE(bs.settings -> 'center_landing', bs.settings -> 'landing', '{}'::jsonb),
      'brand_founders', COALESCE(bs.settings #> '{landing,founders}', '[]'::jsonb),
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
      'curriculum', public.center_public_curriculum_json(b.id, c.id)
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

REVOKE ALL ON FUNCTION public.get_center_landing_public(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_center_landing_public(text, text) TO anon, authenticated;
