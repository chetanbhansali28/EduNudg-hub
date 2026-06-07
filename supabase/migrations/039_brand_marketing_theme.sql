-- Per-brand public marketing theme (platform-controlled) + public stats for footer.

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS marketing_theme text NOT NULL DEFAULT 'novu';

ALTER TABLE public.brands
  DROP CONSTRAINT IF EXISTS brands_marketing_theme_check;

ALTER TABLE public.brands
  ADD CONSTRAINT brands_marketing_theme_check
  CHECK (marketing_theme IN ('novu', 'abacus-classic'));

CREATE OR REPLACE FUNCTION public.brand_public_stats_json(p_brand_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'centers_count', (
      SELECT count(*)::int
      FROM public.franchise_centers fc
      WHERE fc.brand_id = p_brand_id
        AND fc.deleted_at IS NULL
        AND fc.status = 'active'
    ),
    'students_count', (
      SELECT count(*)::int
      FROM public.students st
      WHERE st.brand_id = p_brand_id
        AND st.deleted_at IS NULL
    )
  );
$$;

REVOKE ALL ON FUNCTION public.brand_public_stats_json(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.brand_public_stats_json(uuid) TO anon, authenticated;

-- Ensure curriculum helper exists (introduced in 037; re-declared here for DBs that skipped it).
CREATE OR REPLACE FUNCTION public.brand_public_curriculum_json(p_brand_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(prog ORDER BY prog ->> 'name')
      FROM (
        SELECT jsonb_build_object(
          'name', p.name,
          'description', p.description,
          'why_take', p.why_take,
          'what_you_learn', p.what_you_learn,
          'marketing_video_url', p.marketing_video_url,
          'version_number', COALESCE(cv.version_number, 0),
          'levels', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'name', l.name,
                  'level_code', l.abacus_level_code,
                  'topics_covered', l.topics_covered,
                  'why_take', l.why_take,
                  'what_you_learn', l.what_you_learn,
                  'marketing_video_url', l.marketing_video_url,
                  'modules', COALESCE(
                    (
                      SELECT jsonb_agg(
                        jsonb_build_object(
                          'title', m.title,
                          'lessons', COALESCE(
                            (
                              SELECT jsonb_agg(
                                jsonb_build_object(
                                  'title', ls.title,
                                  'duration_minutes', ls.duration_minutes,
                                  'content_type', ls.content_type
                                )
                                ORDER BY ls.sort_order ASC
                              )
                              FROM public.lessons ls
                              WHERE ls.module_id = m.id
                            ),
                            '[]'::jsonb
                          )
                        )
                        ORDER BY m.sort_order ASC
                      )
                      FROM public.modules m
                      WHERE m.level_id = l.id
                    ),
                    '[]'::jsonb
                  )
                )
                ORDER BY l.sort_order ASC
              )
              FROM public.levels l
              WHERE cv.id IS NOT NULL
                AND l.curriculum_version_id = cv.id
            ),
            '[]'::jsonb
          )
        ) AS prog
        FROM public.programs p
        LEFT JOIN LATERAL (
          SELECT cv2.id, cv2.version_number
          FROM public.curriculum_versions cv2
          WHERE cv2.program_id = p.id
          ORDER BY (cv2.status = 'published') DESC, cv2.version_number DESC
          LIMIT 1
        ) cv ON true
        WHERE p.brand_id = p_brand_id
          AND p.is_active = true
          AND p.deleted_at IS NULL
      ) brand_programs
    ),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.brand_public_curriculum_json(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.brand_public_curriculum_json(uuid) TO anon, authenticated;

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
