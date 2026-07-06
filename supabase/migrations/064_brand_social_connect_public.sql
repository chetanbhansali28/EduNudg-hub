-- Expose brand social connect settings on public marketing bundle (brand site only).

CREATE OR REPLACE FUNCTION public.get_brand_landing_public(p_brand_slug text)
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
      'landing', COALESCE(bs.settings -> 'landing', '{}'::jsonb),
      'legal_pages', COALESCE(bs.settings -> 'legal_pages', '{}'::jsonb),
      'social_connect', COALESCE(bs.settings -> 'social_connect', '{}'::jsonb),
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
  FROM public.brands b
  LEFT JOIN public.brand_settings bs ON bs.brand_id = b.id
  WHERE p_brand_slug IS NOT NULL
    AND b.slug = p_brand_slug
    AND b.deleted_at IS NULL
    AND b.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_brand_landing_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_brand_landing_public(text) TO anon, authenticated;
