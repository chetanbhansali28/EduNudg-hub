-- Program marketing fields for Abacus Classic program cards and detail modals.

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS marketing_image_url text,
  ADD COLUMN IF NOT EXISTS age_label text,
  ADD COLUMN IF NOT EXISTS marketing_benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS scholarship_highlight text;

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
          'marketing_image_url', p.marketing_image_url,
          'age_label', p.age_label,
          'marketing_benefits', COALESCE(p.marketing_benefits, '[]'::jsonb),
          'scholarship_highlight', p.scholarship_highlight,
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
