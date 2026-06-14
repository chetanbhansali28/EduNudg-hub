-- Program enrollment starting point, assessment-linked level progression, center context RPC.

-- ---------------------------------------------------------------------------
-- Assessment columns: tie scores to program level + pass/fail
-- ---------------------------------------------------------------------------

ALTER TABLE public.student_assessments
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level_id uuid REFERENCES public.levels(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS passed boolean;

CREATE INDEX IF NOT EXISTS idx_student_assessments_student_level
  ON public.student_assessments (student_id, level_id, assessed_at DESC);

-- ---------------------------------------------------------------------------
-- Resolve current level for a student in a program
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.resolve_student_current_level(
  p_student_id uuid,
  p_program_id uuid
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id
  FROM public.levels l
  LEFT JOIN public.student_level_progress slp ON slp.student_id = p_student_id
    AND (slp.level_id = l.id OR slp.level_name = l.name)
  WHERE l.program_id = p_program_id
    AND coalesce(slp.status, 'not_started') <> 'completed'
  ORDER BY l.sort_order ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_student_current_level(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_student_current_level(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Mark level completed and start next level on pass
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.advance_student_after_level_pass(
  p_brand_id uuid,
  p_center_id uuid,
  p_student_id uuid,
  p_enrollment_id uuid,
  p_level_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_program_id uuid;
  v_level_name text;
  v_sort_order int;
  v_next_id uuid;
  v_next_name text;
BEGIN
  SELECT l.program_id, l.name, l.sort_order
  INTO v_program_id, v_level_name, v_sort_order
  FROM public.levels l
  WHERE l.id = p_level_id;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Level not found';
  END IF;

  INSERT INTO public.student_level_progress (
    brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
  )
  VALUES (
    p_brand_id, p_center_id, p_student_id, p_enrollment_id, p_level_id, v_level_name,
    'completed', now()
  )
  ON CONFLICT (student_id, level_name) DO UPDATE
  SET status = 'completed',
      level_id = EXCLUDED.level_id,
      enrollment_id = EXCLUDED.enrollment_id,
      completed_at = now(),
      updated_at = now();

  SELECT l.id, l.name INTO v_next_id, v_next_name
  FROM public.levels l
  WHERE l.program_id = v_program_id
    AND l.sort_order > v_sort_order
  ORDER BY l.sort_order ASC
  LIMIT 1;

  IF v_next_id IS NOT NULL THEN
    INSERT INTO public.student_level_progress (
      brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
    )
    VALUES (
      p_brand_id, p_center_id, p_student_id, p_enrollment_id, v_next_id, v_next_name,
      'in_progress', NULL
    )
    ON CONFLICT (student_id, level_name) DO UPDATE
    SET status = 'in_progress',
        level_id = EXCLUDED.level_id,
        enrollment_id = EXCLUDED.enrollment_id,
        completed_at = NULL,
        updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.advance_student_after_level_pass(uuid, uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.advance_student_after_level_pass(uuid, uuid, uuid, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Initialize first level when program is assigned
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.initialize_student_program_start(
  p_brand_id uuid,
  p_center_id uuid,
  p_student_id uuid,
  p_enrollment_id uuid,
  p_program_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.student_level_progress slp
    JOIN public.levels l ON l.id = slp.level_id OR l.name = slp.level_name
    WHERE slp.student_id = p_student_id
      AND l.program_id = p_program_id
  ) THEN
    RETURN;
  END IF;

  SELECT l.id, l.name INTO v_first
  FROM public.levels l
  WHERE l.program_id = p_program_id
  ORDER BY l.sort_order ASC
  LIMIT 1;

  IF v_first.id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.student_level_progress (
    brand_id, center_id, student_id, enrollment_id, level_id, level_name, status, completed_at
  )
  VALUES (
    p_brand_id, p_center_id, p_student_id, p_enrollment_id, v_first.id, v_first.name,
    'in_progress', NULL
  )
  ON CONFLICT (student_id, level_name) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.initialize_student_program_start(uuid, uuid, uuid, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.initialize_student_program_start(uuid, uuid, uuid, uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Pin enrollment to program + start at level 1
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pin_enrollment_program(
  p_enrollment_id uuid,
  p_program_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.student_enrollments%ROWTYPE;
  v_brand_id uuid;
BEGIN
  SELECT * INTO v_enrollment FROM public.student_enrollments WHERE id = p_enrollment_id;
  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'Enrollment not found';
  END IF;

  SELECT fc.brand_id INTO v_brand_id
  FROM public.franchise_centers fc
  WHERE fc.id = v_enrollment.center_id;

  IF NOT public.has_center_access(v_enrollment.center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF NOT public.has_brand_access(v_brand_id) AND NOT public.is_platform_admin() THEN
    PERFORM public.assert_center_operational(v_enrollment.center_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = p_program_id AND p.brand_id = v_enrollment.brand_id AND p.deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  PERFORM public.assert_center_program_authorized(v_enrollment.center_id, p_program_id);

  UPDATE public.student_enrollments
  SET program_id = p_program_id, updated_at = now()
  WHERE id = p_enrollment_id;

  PERFORM public.initialize_student_program_start(
    v_enrollment.brand_id,
    v_enrollment.center_id,
    v_enrollment.student_id,
    v_enrollment.id,
    p_program_id
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Center staff: student program context for assessments UI
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_center_student_program_context(
  p_center_id uuid,
  p_student_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment public.student_enrollments%ROWTYPE;
  v_program_id uuid;
  v_current_level_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_enrollment
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id
    AND e.center_id = p_center_id
    AND e.status = 'active'
  ORDER BY e.enrolled_at DESC
  LIMIT 1;

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'No active enrollment';
  END IF;

  v_program_id := v_enrollment.program_id;

  IF v_program_id IS NOT NULL THEN
    v_current_level_id := public.resolve_student_current_level(p_student_id, v_program_id);
  END IF;

  RETURN jsonb_build_object(
    'enrollment_id', v_enrollment.id,
    'program_id', v_program_id,
    'program_name', (SELECT p.name FROM public.programs p WHERE p.id = v_program_id),
    'current_level_id', v_current_level_id,
    'current_level_name', (SELECT l.name FROM public.levels l WHERE l.id = v_current_level_id),
    'levels', CASE WHEN v_program_id IS NULL THEN '[]'::jsonb ELSE COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'level_id', l.id,
        'name', l.name,
        'sort_order', l.sort_order,
        'status', coalesce(slp.status, 'not_started'),
        'abacus_level_code', l.abacus_level_code
      ) ORDER BY l.sort_order)
      FROM public.levels l
      LEFT JOIN public.student_level_progress slp ON slp.student_id = p_student_id
        AND (slp.level_id = l.id OR slp.level_name = l.name)
      WHERE l.program_id = v_program_id
    ), '[]'::jsonb) END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_center_student_program_context(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_center_student_program_context(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Record assessment with program/level context; auto-advance on pass
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean);

CREATE OR REPLACE FUNCTION public.record_student_assessment(
  p_center_id uuid,
  p_student_id uuid,
  p_assessment_type text,
  p_score numeric DEFAULT NULL,
  p_max_score numeric DEFAULT NULL,
  p_assessed_at date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_visible_to_student boolean DEFAULT true,
  p_level_id uuid DEFAULT NULL,
  p_passed boolean DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_program_id uuid;
  v_level_id uuid;
  v_passed boolean;
  v_id uuid;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc
  WHERE fc.id = p_center_id AND fc.deleted_at IS NULL;
  IF v_brand_id IS NULL THEN RAISE EXCEPTION 'Center not found'; END IF;

  SELECT * INTO v_enrollment
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  ORDER BY e.enrolled_at DESC LIMIT 1;

  IF v_enrollment.id IS NULL THEN
    RAISE EXCEPTION 'No active enrollment';
  END IF;

  v_program_id := v_enrollment.program_id;
  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'Student has no program assigned';
  END IF;

  v_level_id := coalesce(
    p_level_id,
    public.resolve_student_current_level(p_student_id, v_program_id)
  );

  IF v_level_id IS NULL THEN
    RAISE EXCEPTION 'No level available for assessment';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.levels l
    WHERE l.id = v_level_id AND l.program_id = v_program_id
  ) THEN
    RAISE EXCEPTION 'Level does not belong to student program';
  END IF;

  v_passed := p_passed;
  IF v_passed IS NULL AND p_score IS NOT NULL AND p_max_score IS NOT NULL AND p_max_score > 0 THEN
    v_passed := (p_score / p_max_score) >= 0.7;
  END IF;

  INSERT INTO public.student_assessments (
    brand_id, center_id, student_id, enrollment_id, program_id, level_id,
    assessment_type, score, max_score, assessed_at, notes, visible_to_student, passed
  )
  VALUES (
    v_brand_id, p_center_id, p_student_id, v_enrollment.id, v_program_id, v_level_id,
    coalesce(nullif(trim(p_assessment_type), ''), 'level_check'),
    p_score, p_max_score,
    coalesce(p_assessed_at, (now() AT TIME ZONE 'Asia/Kolkata')::date),
    nullif(trim(coalesce(p_notes, '')), ''),
    coalesce(p_visible_to_student, true),
    v_passed
  )
  RETURNING id INTO v_id;

  IF coalesce(v_passed, false) THEN
    PERFORM public.advance_student_after_level_pass(
      v_brand_id, p_center_id, p_student_id, v_enrollment.id, v_level_id
    );
  END IF;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_student_assessment(uuid, uuid, text, numeric, numeric, date, text, boolean, uuid, boolean) TO authenticated;

-- ---------------------------------------------------------------------------
-- Student learn: include level + pass in assessment history
-- ---------------------------------------------------------------------------

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
      'program_id', p.id,
      'program_name', p.name,
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
        WHERE be.student_id = v_student_id AND b.program_id = p.id
      ),
      'curriculum_ladder', (
        SELECT jsonb_build_object(
          'current_level_id', public.resolve_student_current_level(v_student_id, p.id),
          'completion_pct', (
            SELECT CASE WHEN count(*) = 0 THEN 0
              ELSE round((count(*) FILTER (WHERE coalesce(slp.status, 'not_started') = 'completed'))::numeric / count(*)::numeric * 100, 1)
            END
            FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.program_id = p.id
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
            WHERE l.program_id = p.id
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
          'notes', a.notes,
          'passed', a.passed,
          'level_name', coalesce(l.name, (
            SELECT l2.name FROM public.levels l2 WHERE l2.id = a.level_id
          ))
        ) ORDER BY a.assessed_at DESC)
        FROM public.student_assessments a
        LEFT JOIN public.levels l ON l.id = a.level_id
        WHERE a.student_id = v_student_id
          AND a.visible_to_student = true
          AND a.brand_id = p_brand_id
          AND (a.program_id = p.id OR a.program_id IS NULL)
      ), '[]'::jsonb)
    ) AS ladder
    FROM (
      SELECT DISTINCT b.program_id AS pid
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id AND b.deleted_at IS NULL
      WHERE be.student_id = v_student_id
        AND b.brand_id = p_brand_id
        AND b.program_id IS NOT NULL
      UNION
      SELECT e.program_id FROM public.student_enrollments e
      WHERE e.student_id = v_student_id
        AND e.brand_id = p_brand_id
        AND e.status = 'active'
        AND e.program_id IS NOT NULL
    ) src
    JOIN public.programs p ON p.id = src.pid
  ) sub;

  RETURN v_result;
END;
$$;

ALTER FUNCTION public.get_student_program_ladders(uuid) VOLATILE;
