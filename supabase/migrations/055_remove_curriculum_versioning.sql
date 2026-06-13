-- Remove curriculum_versions: levels attach directly to programs.
-- Center auth, batches, and enrollments pin program_id instead of version_id.

-- ---------------------------------------------------------------------------
-- Schema: program_id on levels, batches, enrollments
-- ---------------------------------------------------------------------------

ALTER TABLE public.levels
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE;

UPDATE public.levels l
SET program_id = cv.program_id
FROM public.curriculum_versions cv
WHERE cv.id = l.curriculum_version_id
  AND l.program_id IS NULL;

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id);

UPDATE public.batches b
SET program_id = cv.program_id
FROM public.curriculum_versions cv
WHERE cv.id = b.curriculum_version_id
  AND b.program_id IS NULL;

ALTER TABLE public.student_enrollments
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.programs(id);

UPDATE public.student_enrollments e
SET program_id = cv.program_id
FROM public.curriculum_versions cv
WHERE cv.id = e.curriculum_version_id
  AND e.program_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_levels_program ON public.levels (program_id);

-- ---------------------------------------------------------------------------
-- Program authorization (replaces version-level checks)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assert_center_program_authorized(
  p_center_id uuid,
  p_program_id uuid
)
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_program_id IS NULL THEN
    RETURN;
  END IF;
  IF NOT public.is_program_authorized_for_center(p_center_id, p_program_id) THEN
    RAISE EXCEPTION 'PROGRAM_NOT_AUTHORIZED';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_center_program_authorized(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assert_center_program_authorized(uuid, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_center_program_enablement(
  p_center_id uuid,
  p_program_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_removed uuid;
BEGIN
  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id;
  IF v_brand_id IS NULL OR NOT public.has_brand_access(v_brand_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  FOR v_removed IN
    SELECT cpe.program_id
    FROM public.center_program_enablement cpe
    WHERE cpe.center_id = p_center_id
      AND NOT (cpe.program_id = ANY (coalesce(p_program_ids, ARRAY[]::uuid[])))
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.batches b
      WHERE b.center_id = p_center_id
        AND b.program_id = v_removed
        AND b.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'PROGRAM_IN_USE';
    END IF;
  END LOOP;

  DELETE FROM public.center_program_enablement cpe
  WHERE cpe.center_id = p_center_id
    AND NOT (cpe.program_id = ANY (coalesce(p_program_ids, ARRAY[]::uuid[])));

  INSERT INTO public.center_program_enablement (brand_id, center_id, program_id, authorized_by)
  SELECT v_brand_id, p_center_id, pid, auth.uid()
  FROM unnest(coalesce(p_program_ids, ARRAY[]::uuid[])) AS pid
  WHERE EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = pid AND p.brand_id = v_brand_id AND p.deleted_at IS NULL AND p.is_active = true
  )
  ON CONFLICT (center_id, program_id) DO UPDATE
  SET updated_at = now(), authorized_by = auth.uid();
END;
$$;

-- ---------------------------------------------------------------------------
-- Public curriculum JSON (no version layer)
-- ---------------------------------------------------------------------------

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
              WHERE l.program_id = p.id
            ),
            '[]'::jsonb
          )
        ) AS prog
        FROM public.programs p
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

-- ---------------------------------------------------------------------------
-- Center batch upsert (program-scoped)
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.upsert_center_batch(uuid, uuid, text, uuid, uuid, uuid, boolean, jsonb);

CREATE OR REPLACE FUNCTION public.upsert_center_batch(
  p_batch_id uuid,
  p_center_id uuid,
  p_name text,
  p_program_id uuid,
  p_level_start_id uuid,
  p_level_end_id uuid,
  p_is_open_for_enrollment boolean DEFAULT false,
  p_schedule jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_batch_id uuid;
  v_start_order int;
  v_end_order int;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT fc.brand_id INTO v_brand_id FROM public.franchise_centers fc WHERE fc.id = p_center_id;
  IF v_brand_id IS NULL THEN
    RAISE EXCEPTION 'Center not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.programs p
    WHERE p.id = p_program_id AND p.brand_id = v_brand_id AND p.deleted_at IS NULL AND p.is_active = true
  ) THEN
    RAISE EXCEPTION 'Program not found';
  END IF;

  PERFORM public.assert_center_program_authorized(p_center_id, p_program_id);

  SELECT l.sort_order INTO v_start_order
  FROM public.levels l
  WHERE l.id = p_level_start_id AND l.program_id = p_program_id;
  SELECT l.sort_order INTO v_end_order
  FROM public.levels l
  WHERE l.id = p_level_end_id AND l.program_id = p_program_id;
  IF v_start_order IS NULL OR v_end_order IS NULL OR v_start_order > v_end_order THEN
    RAISE EXCEPTION 'Invalid level range';
  END IF;

  IF p_batch_id IS NULL THEN
    INSERT INTO public.batches (
      brand_id, center_id, name, program_id,
      level_start_id, level_end_id, is_open_for_enrollment, schedule
    )
    VALUES (
      v_brand_id, p_center_id, trim(p_name), p_program_id,
      p_level_start_id, p_level_end_id, coalesce(p_is_open_for_enrollment, false), coalesce(p_schedule, '{}'::jsonb)
    )
    RETURNING id INTO v_batch_id;
  ELSE
    UPDATE public.batches SET
      name = trim(p_name),
      program_id = p_program_id,
      level_start_id = p_level_start_id,
      level_end_id = p_level_end_id,
      is_open_for_enrollment = coalesce(p_is_open_for_enrollment, false),
      schedule = coalesce(p_schedule, '{}'::jsonb),
      updated_at = now()
    WHERE id = p_batch_id AND center_id = p_center_id AND deleted_at IS NULL
    RETURNING id INTO v_batch_id;
    IF v_batch_id IS NULL THEN
      RAISE EXCEPTION 'Batch not found';
    END IF;
  END IF;

  RETURN v_batch_id;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_center_batch(uuid, uuid, text, uuid, uuid, uuid, boolean, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.upsert_center_batch(uuid, uuid, text, uuid, uuid, uuid, boolean, jsonb) TO authenticated;

-- ---------------------------------------------------------------------------
-- Pin enrollment to program
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.pin_enrollment_curriculum(uuid, uuid);

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
END;
$$;

REVOKE ALL ON FUNCTION public.pin_enrollment_program(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pin_enrollment_program(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- Student learn: program ladders (no version dimension)
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
          'current_level_id', (
            SELECT l.id FROM public.levels l
            LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
              AND (slp.level_id = l.id OR slp.level_name = l.name)
            WHERE l.program_id = p.id
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
          'notes', a.notes
        ) ORDER BY a.assessed_at DESC)
        FROM public.student_assessments a
        WHERE a.student_id = v_student_id
          AND a.visible_to_student = true
          AND a.brand_id = p_brand_id
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

-- ---------------------------------------------------------------------------
-- Student open batches + self-join
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_open_batches(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_center_id uuid;
BEGIN
  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN RAISE EXCEPTION 'NO_STUDENT_LINK'; END IF;
  v_center_id := (public.get_student_active_enrollment(v_student_id, p_brand_id)).center_id;

  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'batch_id', b.id,
      'name', b.name,
      'program_name', p.name,
      'level_start', ls.name,
      'level_end', le.name,
      'already_joined', EXISTS (
        SELECT 1 FROM public.batch_enrollments be
        WHERE be.batch_id = b.id AND be.student_id = v_student_id
      )
    ) ORDER BY b.name)
    FROM public.batches b
    JOIN public.programs p ON p.id = b.program_id
    JOIN public.levels ls ON ls.id = b.level_start_id
    JOIN public.levels le ON le.id = b.level_end_id
    WHERE b.center_id = v_center_id
      AND b.deleted_at IS NULL
      AND b.is_open_for_enrollment = true
      AND public.is_program_authorized_for_center(b.center_id, b.program_id)
      AND public.is_center_operational(b.center_id)
  ), '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.join_student_batch(p_batch_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_batch public.batches%ROWTYPE;
  v_student_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_be_id uuid;
  v_brand_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_batch FROM public.batches b
  WHERE b.id = p_batch_id AND b.deleted_at IS NULL;
  IF v_batch.id IS NULL THEN
    RAISE EXCEPTION 'Batch not found';
  END IF;
  IF NOT v_batch.is_open_for_enrollment THEN
    RAISE EXCEPTION 'BATCH_NOT_OPEN';
  END IF;

  PERFORM public.assert_center_operational(v_batch.center_id);

  v_brand_id := v_batch.brand_id;
  v_student_id := public.resolve_student_for_learn(v_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, v_brand_id);
  IF v_enrollment.center_id <> v_batch.center_id THEN
    RAISE EXCEPTION 'WRONG_CENTER';
  END IF;

  PERFORM public.assert_center_program_authorized(v_batch.center_id, v_batch.program_id);

  INSERT INTO public.batch_enrollments (brand_id, center_id, batch_id, student_id, enrollment_id)
  VALUES (v_batch.brand_id, v_batch.center_id, v_batch.id, v_student_id, v_enrollment.id)
  ON CONFLICT (batch_id, student_id) DO UPDATE
  SET enrollment_id = EXCLUDED.enrollment_id, updated_at = now()
  RETURNING id INTO v_be_id;

  INSERT INTO public.batch_join_events (
    brand_id, center_id, batch_id, student_id, batch_enrollment_id
  )
  VALUES (v_batch.brand_id, v_batch.center_id, v_batch.id, v_student_id, v_be_id);

  RETURN v_be_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_student_batch_assignments(
  p_student_id uuid,
  p_center_id uuid,
  p_batch_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment_id uuid;
  v_bid uuid;
  v_batch public.batches%ROWTYPE;
BEGIN
  IF NOT public.has_center_access(p_center_id) AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT e.id INTO v_enrollment_id
  FROM public.student_enrollments e
  WHERE e.student_id = p_student_id AND e.center_id = p_center_id AND e.status = 'active'
  LIMIT 1;

  IF v_enrollment_id IS NULL THEN
    RAISE EXCEPTION 'No active enrollment';
  END IF;

  DELETE FROM public.batch_enrollments be
  WHERE be.student_id = p_student_id AND be.center_id = p_center_id
    AND NOT (be.batch_id = ANY (coalesce(p_batch_ids, ARRAY[]::uuid[])));

  FOREACH v_bid IN ARRAY coalesce(p_batch_ids, ARRAY[]::uuid[])
  LOOP
    SELECT * INTO v_batch FROM public.batches b
    WHERE b.id = v_bid AND b.center_id = p_center_id AND b.deleted_at IS NULL;
    IF v_batch.id IS NULL THEN
      RAISE EXCEPTION 'Batch not found';
    END IF;
    PERFORM public.assert_center_program_authorized(v_batch.center_id, v_batch.program_id);

    INSERT INTO public.batch_enrollments (brand_id, center_id, batch_id, student_id, enrollment_id)
    VALUES (v_batch.brand_id, p_center_id, v_bid, p_student_id, v_enrollment_id)
    ON CONFLICT (batch_id, student_id) DO UPDATE
    SET enrollment_id = EXCLUDED.enrollment_id, updated_at = now();
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- Student learn home (program-scoped ladder)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_student_learn_home(p_brand_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
  v_enrollment public.student_enrollments%ROWTYPE;
  v_result jsonb;
  v_program_id uuid;
  v_levels_total int := 0;
  v_levels_completed int := 0;
  v_current_level_id uuid;
  v_completion_pct numeric := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_student_id := public.resolve_student_for_learn(p_brand_id);
  IF v_student_id IS NULL THEN
    RAISE EXCEPTION 'NO_STUDENT_LINK';
  END IF;

  v_enrollment := public.get_student_active_enrollment(v_student_id, p_brand_id);
  v_program_id := v_enrollment.program_id;

  IF v_program_id IS NOT NULL THEN
    SELECT count(*)::int INTO v_levels_total
    FROM public.levels l WHERE l.program_id = v_program_id;

    SELECT count(*)::int INTO v_levels_completed
    FROM public.student_level_progress slp
    WHERE slp.student_id = v_student_id AND slp.status = 'completed'
      AND (slp.level_id IN (SELECT id FROM public.levels WHERE program_id = v_program_id)
           OR slp.enrollment_id = v_enrollment.id);

    SELECT l.id INTO v_current_level_id
    FROM public.levels l
    LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
      AND (slp.level_id = l.id OR slp.level_name = l.name)
    WHERE l.program_id = v_program_id
      AND coalesce(slp.status, 'not_started') <> 'completed'
    ORDER BY l.sort_order ASC
    LIMIT 1;

    IF v_levels_total > 0 THEN
      v_completion_pct := round((v_levels_completed::numeric / v_levels_total::numeric) * 100, 1);
    END IF;
  END IF;

  SELECT jsonb_build_object(
    'student', (
      SELECT jsonb_build_object(
        'id', s.id,
        'full_name', s.full_name,
        'student_code', s.student_code,
        'date_of_birth', s.date_of_birth,
        'profile', jsonb_build_object(
          'school_name', sp.school_name,
          'city', sp.city,
          'pincode', sp.pincode
        )
      )
      FROM public.students s
      LEFT JOIN public.student_profiles sp ON sp.student_id = s.id
      WHERE s.id = v_student_id
    ),
    'brand', (
      SELECT jsonb_build_object(
        'id', b.id,
        'name', b.name,
        'logo_url', null
      )
      FROM public.brands b WHERE b.id = p_brand_id
    ),
    'enrollment', jsonb_build_object(
      'enrollment_id', v_enrollment.id,
      'status', v_enrollment.status,
      'enrolled_at', v_enrollment.enrolled_at,
      'center_id', v_enrollment.center_id,
      'batch_name', (
        SELECT b.name FROM public.batch_enrollments be
        JOIN public.batches b ON b.id = be.batch_id
        WHERE be.enrollment_id = v_enrollment.id OR (be.student_id = v_student_id AND be.center_id = v_enrollment.center_id)
        ORDER BY be.created_at DESC LIMIT 1
      ),
      'program_id', v_program_id,
      'program_name', (
        SELECT p.name FROM public.programs p WHERE p.id = v_program_id
      )
    ),
    'center', (
      SELECT jsonb_build_object(
        'id', fc.id,
        'display_name', coalesce(fc.display_name, fc.name),
        'short_description', fc.short_description,
        'city', fc.city,
        'contact_phone', fc.contact_phone,
        'public_url', coalesce(
          (SELECT 'http://' || dm.hostname || ':9000/'
           FROM public.domain_mappings dm
           WHERE dm.center_id = fc.id AND dm.portal_type = 'center' AND dm.is_primary
           LIMIT 1),
          ''
        )
      )
      FROM public.franchise_centers fc WHERE fc.id = v_enrollment.center_id
    ),
    'curriculum_ladder', jsonb_build_object(
      'current_level_id', v_current_level_id,
      'completion_pct', v_completion_pct,
      'levels', CASE WHEN v_program_id IS NULL THEN '[]'::jsonb ELSE COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'level_id', l.id,
            'name', l.name,
            'sort_order', l.sort_order,
            'status', coalesce(slp.status, 'not_started'),
            'completed_at', slp.completed_at,
            'abacus_level_code', l.abacus_level_code
          ) ORDER BY l.sort_order
        )
        FROM public.levels l
        LEFT JOIN public.student_level_progress slp ON slp.student_id = v_student_id
          AND (slp.level_id = l.id OR slp.level_name = l.name)
        WHERE l.program_id = v_program_id
      ), '[]'::jsonb) END
    ),
    'stats', jsonb_build_object(
      'levels_completed', v_levels_completed,
      'levels_total', v_levels_total,
      'assessments_count', (
        SELECT count(*)::int FROM public.student_assessments a
        WHERE a.student_id = v_student_id AND a.visible_to_student = true
      ),
      'avg_score_pct', (
        SELECT round(avg(a.score / nullif(a.max_score, 0) * 100), 1)
        FROM public.student_assessments a
        WHERE a.student_id = v_student_id AND a.visible_to_student = true
          AND a.score IS NOT NULL AND a.max_score IS NOT NULL AND a.max_score > 0
      ),
      'competitions_registered', (
        SELECT count(*)::int FROM public.student_competition_registrations r
        WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
      ),
      'competitions_completed', (
        SELECT count(*)::int FROM public.student_competition_entries sce
        WHERE sce.student_id = v_student_id
      )
    ),
    'upcoming_competitions', COALESCE((
      SELECT jsonb_agg(comp ORDER BY comp->>'event_date' ASC NULLS LAST)
      FROM (
        SELECT jsonb_build_object(
          'id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'location', bc.location,
          'registration_opens_at', bc.registration_opens_at,
          'registration_closes_at', bc.registration_closes_at,
          'fee_type', bc.fee_type,
          'fee_amount', bc.fee_amount,
          'fee_currency', bc.fee_currency,
          'registration_status', CASE
            WHEN bc.registration_mode = 'closed' THEN 'closed'
            WHEN bc.registration_opens_at IS NOT NULL AND now() < bc.registration_opens_at THEN 'upcoming'
            WHEN bc.registration_closes_at IS NOT NULL AND now() > bc.registration_closes_at THEN 'closed'
            ELSE 'open'
          END,
          'my_registration_status', coalesce((
            SELECT r.status FROM public.student_competition_registrations r
            WHERE r.competition_id = bc.id AND r.student_id = v_student_id
          ), 'none'),
          'can_enroll', (
            bc.fee_type = 'free'
            AND bc.registration_mode = 'open'
            AND (bc.registration_opens_at IS NULL OR now() >= bc.registration_opens_at)
            AND (bc.registration_closes_at IS NULL OR now() <= bc.registration_closes_at)
            AND coalesce((
              SELECT r.status FROM public.student_competition_registrations r
              WHERE r.competition_id = bc.id AND r.student_id = v_student_id
            ), 'none') NOT IN ('registered', 'confirmed', 'waitlisted')
          ),
          'enroll_blocked_reason', CASE
            WHEN bc.fee_type = 'paid' THEN 'paid_coming_soon'
            WHEN bc.registration_mode <> 'open' THEN 'registration_closed'
            WHEN bc.registration_closes_at IS NOT NULL AND now() > bc.registration_closes_at THEN 'registration_closed'
            ELSE null
          END
        ) AS comp
        FROM public.brand_competitions bc
        WHERE bc.brand_id = p_brand_id AND bc.is_active = true
          AND (bc.event_date IS NULL OR bc.event_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
      ) sub
    ), '[]'::jsonb),
    'my_registrations', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'registration_id', r.id,
          'competition_id', bc.id,
          'name', bc.name,
          'event_date', bc.event_date,
          'status', r.status,
          'fee_type', bc.fee_type
        ) ORDER BY bc.event_date ASC NULLS LAST
      )
      FROM public.student_competition_registrations r
      JOIN public.brand_competitions bc ON bc.id = r.competition_id
      WHERE r.student_id = v_student_id AND r.status IN ('registered', 'confirmed', 'waitlisted')
    ), '[]'::jsonb),
    'recent_results', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'competition_name', bc.name,
          'event_date', bc.event_date,
          'result_rank', sce.result_rank,
          'rank_position', sce.rank_position,
          'score', sce.score
        ) ORDER BY bc.event_date DESC NULLS LAST
      )
      FROM public.student_competition_entries sce
      JOIN public.brand_competitions bc ON bc.id = sce.competition_id
      WHERE sce.student_id = v_student_id
      LIMIT 3
    ), '[]'::jsonb),
    'recent_assessments', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', a.id,
          'assessment_type', a.assessment_type,
          'score', a.score,
          'max_score', a.max_score,
          'assessed_at', a.assessed_at,
          'level_name', null
        ) ORDER BY a.assessed_at DESC
      )
      FROM (
        SELECT * FROM public.student_assessments
        WHERE student_id = v_student_id AND visible_to_student = true
        ORDER BY assessed_at DESC LIMIT 5
      ) a
    ), '[]'::jsonb),
    'recent_activity', COALESCE((
      SELECT jsonb_agg(row.ev ORDER BY (row.ev->>'occurred_at') DESC)
      FROM (
        SELECT ev FROM (
          SELECT jsonb_build_object(
            'type', 'level_progress',
            'title', 'Level ' || slp.level_name,
            'subtitle', slp.status,
            'occurred_at', coalesce(slp.completed_at, slp.updated_at),
            'href', '/progress'
          ) AS ev,
          coalesce(slp.completed_at, slp.updated_at) AS sort_at
          FROM public.student_level_progress slp
          WHERE slp.student_id = v_student_id
          UNION ALL
          SELECT jsonb_build_object(
            'type', 'assessment',
            'title', a.assessment_type,
            'subtitle', coalesce(a.score::text, '') || coalesce('/' || a.max_score::text, ''),
            'occurred_at', a.assessed_at::timestamptz,
            'href', '/progress'
          ),
          a.assessed_at::timestamptz
          FROM public.student_assessments a
          WHERE a.student_id = v_student_id AND a.visible_to_student = true
          UNION ALL
          SELECT jsonb_build_object(
            'type', 'competition_registration',
            'title', bc.name,
            'subtitle', r.status,
            'occurred_at', r.registered_at,
            'href', '/competitions'
          ),
          r.registered_at
          FROM public.student_competition_registrations r
          JOIN public.brand_competitions bc ON bc.id = r.competition_id
          WHERE r.student_id = v_student_id
          UNION ALL
          SELECT jsonb_build_object(
            'type', 'competition_result',
            'title', bc.name,
            'subtitle', coalesce(sce.result_rank, 'Result posted'),
            'occurred_at', coalesce(bc.event_date::timestamptz, sce.updated_at),
            'href', '/competitions'
          ),
          coalesce(bc.event_date::timestamptz, sce.updated_at)
          FROM public.student_competition_entries sce
          JOIN public.brand_competitions bc ON bc.id = sce.competition_id
          WHERE sce.student_id = v_student_id
        ) combined
        ORDER BY sort_at DESC
        LIMIT 10
      ) row
    ), '[]'::jsonb),
    'quick_actions', jsonb_build_array(
      jsonb_build_object('label', 'View full progress', 'href', '/progress'),
      jsonb_build_object('label', 'All competitions', 'href', '/competitions'),
      jsonb_build_object('label', 'Activity timeline', 'href', '/activity'),
      jsonb_build_object('label', 'My profile', 'href', '/profile')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Purge program (no version layer)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.purge_curriculum_program(p_program_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_brand_id uuid;
  v_level_ids uuid[];
BEGIN
  SELECT p.brand_id INTO v_brand_id
  FROM public.programs p
  WHERE p.id = p_program_id AND p.deleted_at IS NULL;

  IF v_brand_id IS NULL THEN
    RETURN;
  END IF;

  IF auth.uid() IS NOT NULL
     AND NOT public.has_brand_access(v_brand_id)
     AND NOT public.is_platform_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT coalesce(array_agg(l.id), ARRAY[]::uuid[])
  INTO v_level_ids
  FROM public.levels l
  WHERE l.program_id = p_program_id;

  DELETE FROM public.student_level_progress slp
  WHERE slp.brand_id = v_brand_id
    AND (
      slp.level_id = ANY (v_level_ids)
      OR slp.level_name IN (SELECT l.name FROM public.levels l WHERE l.id = ANY (v_level_ids))
    );

  UPDATE public.student_enrollments e
  SET program_id = NULL, updated_at = now()
  WHERE e.program_id = p_program_id;

  UPDATE public.batches b
  SET
    deleted_at = coalesce(b.deleted_at, now()),
    program_id = NULL,
    level_start_id = NULL,
    level_end_id = NULL,
    level_id = NULL,
    updated_at = now()
  WHERE b.program_id = p_program_id
     OR b.level_start_id = ANY (v_level_ids)
     OR b.level_end_id = ANY (v_level_ids)
     OR b.level_id = ANY (v_level_ids);

  DELETE FROM public.programs WHERE id = p_program_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- Drop version layer
-- ---------------------------------------------------------------------------

ALTER TABLE public.levels DROP COLUMN IF EXISTS curriculum_version_id;
ALTER TABLE public.levels ALTER COLUMN program_id SET NOT NULL;

ALTER TABLE public.batches DROP COLUMN IF EXISTS curriculum_version_id;
ALTER TABLE public.student_enrollments DROP COLUMN IF EXISTS curriculum_version_id;

DROP TABLE IF EXISTS public.center_curriculum_enablement CASCADE;
DROP TABLE IF EXISTS public.curriculum_versions CASCADE;

DROP FUNCTION IF EXISTS public.clone_curriculum_version_to_draft(uuid);
DROP FUNCTION IF EXISTS public.sync_center_curriculum_enablement(uuid, uuid[]);
DROP FUNCTION IF EXISTS public.is_curriculum_version_authorized_for_center(uuid, uuid);
DROP FUNCTION IF EXISTS public.assert_center_curriculum_authorized(uuid, uuid);
DROP FUNCTION IF EXISTS public._sync_center_programs_from_curricula(uuid, uuid);

NOTIFY pgrst, 'reload schema';
