-- Public read of published brand success stories for marketing testimonials

CREATE OR REPLACE FUNCTION public.get_brand_success_stories_public(p_brand_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
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
      INNER JOIN public.brands b ON b.id = s.brand_id
      WHERE p_brand_slug IS NOT NULL
        AND b.slug = p_brand_slug
        AND b.deleted_at IS NULL
        AND b.status = 'active'
        AND s.is_published = true
    ),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.get_brand_success_stories_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_brand_success_stories_public(text) TO anon, authenticated;
