-- Public marketing: published curriculum + center landing success stories.

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
      'landing', COALESCE(bs.settings -> 'landing', '{}'::jsonb),
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
      'curriculum', COALESCE(
        (
          SELECT jsonb_agg(prog ORDER BY prog ->> 'name')
          FROM (
            SELECT jsonb_build_object(
              'name', p.name,
              'description', p.description,
              'why_take', p.why_take,
              'what_you_learn', p.what_you_learn,
              'marketing_video_url', p.marketing_video_url,
              'version_number', cv.version_number,
              'levels', COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'name', l.name,
                      'level_code', l.abacus_level_code,
                      'topics_covered', l.topics_covered,
                      'why_take', l.why_take,
                      'what_you_learn', l.what_you_learn,
                      'marketing_video_url', l.marketing_video_url
                    )
                    ORDER BY l.sort_order ASC
                  )
                  FROM public.levels l
                  WHERE l.curriculum_version_id = cv.id
                ),
                '[]'::jsonb
              )
            ) AS prog
            FROM public.programs p
            INNER JOIN LATERAL (
              SELECT cv2.id, cv2.version_number
              FROM public.curriculum_versions cv2
              WHERE cv2.program_id = p.id
                AND cv2.status = 'published'
              ORDER BY cv2.version_number DESC
              LIMIT 1
            ) cv ON true
            WHERE p.brand_id = b.id
              AND p.is_active = true
              AND p.deleted_at IS NULL
          ) published_programs
        ),
        '[]'::jsonb
      )
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
      'curriculum', COALESCE(
        (
          SELECT jsonb_agg(prog ORDER BY prog ->> 'name')
          FROM (
            SELECT jsonb_build_object(
              'name', p.name,
              'description', p.description,
              'why_take', p.why_take,
              'what_you_learn', p.what_you_learn,
              'marketing_video_url', p.marketing_video_url,
              'version_number', cv.version_number,
              'levels', COALESCE(
                (
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'name', l.name,
                      'level_code', l.abacus_level_code,
                      'topics_covered', l.topics_covered,
                      'why_take', l.why_take,
                      'what_you_learn', l.what_you_learn,
                      'marketing_video_url', l.marketing_video_url
                    )
                    ORDER BY l.sort_order ASC
                  )
                  FROM public.levels l
                  WHERE l.curriculum_version_id = cv.id
                ),
                '[]'::jsonb
              )
            ) AS prog
            FROM public.programs p
            INNER JOIN LATERAL (
              SELECT cv2.id, cv2.version_number
              FROM public.curriculum_versions cv2
              WHERE cv2.program_id = p.id
                AND cv2.status = 'published'
              ORDER BY cv2.version_number DESC
              LIMIT 1
            ) cv ON true
            WHERE p.brand_id = b.id
              AND p.is_active = true
              AND p.deleted_at IS NULL
          ) published_programs
        ),
        '[]'::jsonb
      )
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
