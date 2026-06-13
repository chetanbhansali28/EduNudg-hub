-- Fix get_student_program_ladders: student_assessments has no level_id column (400 from PostgREST).
-- Also ignore batches without curriculum_version_id in ladder discovery.

CREATE OR REPLACE FUNCTION public.get_student_program_ladders(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_result jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;
  PERFORM public.get_student_active_enrollment(v_student_id, p_brand_id);

  SELECT coalesce(jsonb_agg(ladder ORDER BY ladder->>'program_name'), '[]'::jsonb) INTO v_result
  FROM (
    SELECT jsonb_build_object(
      'curriculum_version_id', cv.id,
      'program_id', p.id,
      'program_name', p.name,
      'curriculum_label', 'v' || cv.version_number::text || ' — ' || p.name,
      'batches', (
        SELECT coalesce(jsonb_agg(jsonb_build_object(
          'batch_id', b.id,
          'batch_name', b.name,
          'level_start', ls.name,
          'level_end', le.name
        ) ORDER BY b.name), '[]'::jsonb)
        FROM public.batch_enrollments be
        JOIN public.batches b ON b.id = be.batch_id AND b.deleted_at IS NULL
        LEFT JOIN public.levels ls ON ls.id = b.level_start_id
        LEFT JOIN public.levels le ON le.id = b.level_end_id
        WHERE be.student_id = v_student_id AND b.curriculum_version_id = cv.id
      ),
      'curriculum_ladder', (
        SELECT jsonb_build_object(
          'current_level_id', (
            SELECT l.id FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.curriculum_version_id = cv.id
              AND coalesce(slp.status, 'not_started') <> 'completed'
            ORDER BY l.sort_order ASC LIMIT 1
          ),
          'completion_pct', (
            SELECT CASE WHEN count(*) = 0 THEN 0
              ELSE round((count(*) FILTER (WHERE coalesce(slp.status, 'not_started') = 'completed'))::numeric / count(*)::numeric * 100, 1)
            END
            FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.curriculum_version_id = cv.id
          ),
          'levels', coalesce((
            SELECT jsonb_agg(jsonb_build_object(
              'level_id', l.id,
              'name', l.name,
              'sort_order', l.sort_order,
              'status', coalesce(slp.status, 'not_started'),
              'completed_at', slp.completed_at,
              'abacus_level_code', l.abacus_level_code
            ) ORDER BY l.sort_order)
            FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.curriculum_version_id = cv.id
          ), '[]'::jsonb)
        )
      ),
      'assessments', coalesce((
        SELECT jsonb_agg(jsonb_build_object(
          'id', a.id,
          'assessment_type', a.assessment_type,
          'score', a.score,
          'max_score', a.max_score,
          'assessed_at', a.assessed_at,
          'notes', a.notes
        ) ORDER BY a.assessed_at DESC)
        FROM public.student_assessments a
        WHERE a.student_id = v_student_id
          AND a.visible_to_student = true
          AND a.brand_id = p_brand_id
      ), '[]'::jsonb)
    ) AS ladder
    FROM (
      SELECT DISTINCT b.curriculum_version_id AS cv_id
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id AND b.deleted_at IS NULL
      WHERE be.student_id = v_student_id
        AND b.brand_id = p_brand_id
        AND b.curriculum_version_id IS NOT NULL
      UNION
      SELECT e.curriculum_version_id FROM public.student_enrollments e
      WHERE e.student_id = v_student_id
        AND e.brand_id = p_brand_id
        AND e.status = 'active'
        AND e.curriculum_version_id IS NOT NULL
    ) src
    JOIN public.curriculum_versions cv ON cv.id = src.cv_id
    JOIN public.programs p ON p.id = cv.program_id
  ) sub;

  RETURN v_result;
END;
$$;

ALTER FUNCTION public.get_student_program_ladders(uuid) VOLATILE;

NOTIFY pgrst, 'reload schema';
